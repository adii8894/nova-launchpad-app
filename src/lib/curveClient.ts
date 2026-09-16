import {
  PublicKey,
  SystemProgram,
  Keypair,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { AnchorProvider, Program, BN, Idl } from "@coral-xyz/anchor";
import idl from "./bonding_curve.json";

export const PROGRAM_ID = new PublicKey(
  "9LJiHRg3gJ6QYNRHSE1p4gXB9J8VfLgyjna782scQ4in"
);

export const MIGRATION_SOL_TARGET = 85_000_000_000;

export const PLATFORM_WALLET = new PublicKey(
  "EfcLSxUSsKzf47prgmmJjdXp13iNkkz3YYXD2mbVC3o4"
);

export const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

export function getMetadataPda(mint: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID
  );
}

export const CURVE_SEED = Buffer.from("curve");
export const SOL_VAULT_SEED = Buffer.from("sol_vault");

export function getCurvePda(mint: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [CURVE_SEED, mint.toBuffer()],
    PROGRAM_ID
  );
}

export function getSolVaultPda(mint: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [SOL_VAULT_SEED, mint.toBuffer()],
    PROGRAM_ID
  );
}

function normalizeProvider(provider: AnchorProvider): AnchorProvider {
  const normalizedWallet = {
    ...provider.wallet,
    publicKey: new PublicKey(provider.wallet.publicKey.toBase58()),
  };
  return new AnchorProvider(
    provider.connection,
    normalizedWallet as any,
    provider.opts
  );
}

export function getProgram(provider: AnchorProvider) {
  const normalized = normalizeProvider(provider);
  return new Program(idl as Idl, PROGRAM_ID, normalized);
}

export async function createToken(
  provider: AnchorProvider,
  params: { name: string; symbol: string; uri: string }
) {
  const program = getProgram(provider);
  const walletPubkey = new PublicKey(provider.wallet.publicKey.toBase58());
  const mint = Keypair.generate();
  const [curve] = getCurvePda(mint.publicKey);
  const [solVault] = getSolVaultPda(mint.publicKey);
  const curveTokenVault = getAssociatedTokenAddressSync(
    mint.publicKey,
    curve,
    true
  );

  const [metadata] = getMetadataPda(mint.publicKey);

  const sig = await program.methods
    .createToken(params.name, params.symbol, params.uri)
    .accounts({
      creator: walletPubkey,
      mint: mint.publicKey,
      curve,
      solVault,
      curveTokenVault,
      metadata,
      platform: PLATFORM_WALLET,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .signers([mint])
    .rpc();

  return { signature: sig, mint: mint.publicKey, curve };
}

export async function buyTokens(
  provider: AnchorProvider,
  mint: PublicKey,
  solInLamports: number,
  minTokensOut: number,
  creator: PublicKey
) {
  const program = getProgram(provider);
  const walletPubkey = new PublicKey(provider.wallet.publicKey.toBase58());
  const [curve] = getCurvePda(mint);
  const [solVault] = getSolVaultPda(mint);
  const curveTokenVault = getAssociatedTokenAddressSync(mint, curve, true);
  const userTokenAccount = getAssociatedTokenAddressSync(mint, walletPubkey);

  return program.methods
    .buy(new BN(solInLamports), new BN(minTokensOut))
    .accounts({
      user: walletPubkey,
      curve,
      solVault,
      curveTokenVault,
      userTokenAccount,
      mint,
      creator,
      platform: PLATFORM_WALLET,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

export async function sellTokens(
  provider: AnchorProvider,
  mint: PublicKey,
  tokensIn: number,
  minSolOut: number,
  creator: PublicKey
) {
  const program = getProgram(provider);
  const walletPubkey = new PublicKey(provider.wallet.publicKey.toBase58());
  const [curve] = getCurvePda(mint);
  const [solVault] = getSolVaultPda(mint);
  const curveTokenVault = getAssociatedTokenAddressSync(mint, curve, true);
  const userTokenAccount = getAssociatedTokenAddressSync(mint, walletPubkey);

  return program.methods
    .sell(new BN(tokensIn), new BN(minSolOut))
    .accounts({
      user: walletPubkey,
      curve,
      solVault,
      curveTokenVault,
      userTokenAccount,
      mint,
      creator,
      platform: PLATFORM_WALLET,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

export async function getCurveState(provider: AnchorProvider, mint: PublicKey) {
  const program = getProgram(provider);
  const [curve] = getCurvePda(mint);
  return program.account.curveState.fetch(curve);
}
