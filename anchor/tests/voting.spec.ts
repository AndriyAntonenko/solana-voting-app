import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { Voting } from "../target/types/voting";

import IDL from "../target/idl/voting.json";
import { BankrunProvider, startAnchor } from "anchor-bankrun";
import { ProgramTestContext } from "solana-bankrun";

const votingAddress = new PublicKey(
  "coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF"
);

describe("Voting", () => {
  let context: ProgramTestContext;
  let provider: BankrunProvider;
  let votingProgram: Program<Voting>;

  beforeAll(async () => {
    context = await startAnchor(
      "",
      [{ name: "Voting", programId: votingAddress }],
      []
    );
    provider = new BankrunProvider(context);
    votingProgram = new Program<Voting>(IDL as Voting, provider);
  });

  it("Initialize Poll", async () => {
    await votingProgram.methods
      .initializePoll(
        new anchor.BN(1),
        new anchor.BN(0),
        new anchor.BN(1841201571),
        "What is your favorite type of peanut butter?"
      )
      .rpc();

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8)],
      votingAddress
    );

    const poll = await votingProgram.account.poll.fetch(pollAddress);

    console.log("Poll: ", poll);

    expect(poll.pollId.toNumber()).toEqual(1);
    expect(poll.pollEnd.toNumber()).toEqual(1841201571);
    expect(poll.description).toEqual(
      "What is your favorite type of peanut butter?"
    );
    expect(poll.candidatesAmount.toNumber()).toEqual(0);
    expect(poll.pollStart.toNumber()).toEqual(0);
  });

  it("Initialize candidate", async () => {
    await votingProgram.methods
      .initializeCandidate("Crunchy", new anchor.BN(1))
      .rpc();

    await votingProgram.methods
      .initializeCandidate("Smooth", new anchor.BN(1))
      .rpc();

    const [cranchyAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("Crunchy")],
      votingAddress
    );

    const [smoothAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("Smooth")],
      votingAddress
    );

    const cranchy = await votingProgram.account.candidate.fetch(cranchyAddress);
    const smooth = await votingProgram.account.candidate.fetch(smoothAddress);

    console.log("Cranchy: ", cranchy);
    console.log("Smooth: ", smooth);

    expect(cranchy.candidateName).toEqual("Crunchy");
    expect(cranchy.candidateVotes.toNumber()).toEqual(0);

    expect(smooth.candidateName).toEqual("Smooth");
    expect(smooth.candidateVotes.toNumber()).toEqual(0);

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8)],
      votingAddress
    );

    const poll = await votingProgram.account.poll.fetch(pollAddress);

    expect(poll.candidatesAmount.toNumber()).toEqual(2);
  });

  it("vote", async () => {
    await votingProgram.methods.vote("Crunchy", new anchor.BN(1)).rpc();

    const [cranchyAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("Crunchy")],
      votingAddress
    );

    const cranchy = await votingProgram.account.candidate.fetch(cranchyAddress);

    expect(cranchy.candidateVotes.toNumber()).toEqual(1);
  });
});
