#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("CRvVtKXdRUadhSN1yN7w6EZFgR2gVSfdCnsj1dF7CytV");

pub const ANCHOR_DISCRIMINATOR_SIZE: usize = 8;

#[program]
pub mod voting {
    use super::*;

    pub fn initialize_poll(
        ctx: Context<InitializePoll>,
        poll_id: u64,
        poll_start: u64,
        poll_end: u64,
        description: String,
    ) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        poll.poll_id = poll_id;
        poll.poll_start = poll_start;
        poll.poll_end = poll_end;
        poll.description = description;
        poll.candidates_amount = 0;

        Ok(())
    }

    pub fn initialize_candidate(
        ctx: Context<InitializeCandidate>,
        candidate_name: String,
        _poll_id: u64,
    ) -> Result<()> {
        let candidate = &mut ctx.accounts.candidate;
        let poll = &mut ctx.accounts.poll;
        // Increment the number of candidates in the poll
        poll.candidates_amount += 1;

        candidate.candidate_name = candidate_name;
        candidate.candidate_votes = 0;
        Ok(())
    }

    pub fn vote(ctx: Context<Vote>, _candidate_name: String, _poll_id: u64) -> Result<()> {
        let candidate = &mut ctx.accounts.candidate;
        candidate.candidate_votes += 1;
        msg!("Voted for candidate: {}", candidate.candidate_name);
        msg!("Votes: {}", candidate.candidate_votes);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(poll_id: u64)]
pub struct InitializePoll<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
      init,
      payer = signer,
      space = ANCHOR_DISCRIMINATOR_SIZE + Poll::INIT_SPACE,
      seeds = [poll_id.to_le_bytes().as_ref()],
      bump
    )] // making poll account, using poll_id as seed
    pub poll: Account<'info, Poll>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Poll {
    pub poll_id: u64,
    #[max_len(200)]
    pub description: String,
    pub poll_start: u64,
    pub poll_end: u64,
    pub candidates_amount: u64,
}

#[derive(Accounts)]
#[instruction(candidate_name: String, poll_id: u64)]
pub struct InitializeCandidate<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [poll_id.to_le_bytes().as_ref()],
        bump
    )] // just using existing poll account
    pub poll: Account<'info, Poll>,

    #[account(
      init,
      payer = signer,
      space = ANCHOR_DISCRIMINATOR_SIZE + Candidate::INIT_SPACE,
      seeds = [poll_id.to_le_bytes().as_ref(), candidate_name.as_bytes()],
      bump
    )]
    pub candidate: Account<'info, Candidate>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Candidate {
    #[max_len(64)]
    pub candidate_name: String,
    pub candidate_votes: u64,
}

#[derive(Accounts)]
#[instruction(candidate_name: String, poll_id: u64)]
pub struct Vote<'info> {
    pub signer: Signer<'info>,

    #[account(
        seeds = [poll_id.to_le_bytes().as_ref()],
        bump
      )] // just using existing poll account
    pub poll: Account<'info, Poll>,

    #[account(
        mut,
        seeds = [poll_id.to_le_bytes().as_ref(), candidate_name.as_bytes()],
        bump
      )] // just using existing candidate account
    pub candidate: Account<'info, Candidate>,

    pub system_program: Program<'info, System>,
}
