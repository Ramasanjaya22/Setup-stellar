#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Vec};

#[contract]
pub struct Contract;

#[derive(Clone)]
#[contracttype]
pub struct FundingPool {
    pub id: u64,
    pub owner: Address,
    pub target_amount: i128,
    pub deadline_ts: u64,
    pub total_funded: i128,
    pub is_closed: bool,
}

#[derive(Clone)]
#[contracttype]
pub struct Contribution {
    pub contributor: Address,
    pub amount: i128,
    pub timestamp: u64,
}

#[derive(Clone)]
#[contracttype]
enum DataKey {
    PoolCounter,
    Pool(u64),
    Contributions(u64),
}

#[contractimpl]
impl Contract {
    pub fn create_pool(env: Env, owner: Address, target_amount: i128, deadline_ts: u64) -> u64 {
        owner.require_auth();
        assert!(target_amount > 0, "target amount must be positive");
        assert!(
            deadline_ts > env.ledger().timestamp(),
            "deadline must be in future"
        );

        let mut next_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::PoolCounter)
            .unwrap_or(0);
        next_id += 1;

        let pool = FundingPool {
            id: next_id,
            owner: owner.clone(),
            target_amount,
            deadline_ts,
            total_funded: 0,
            is_closed: false,
        };

        env.storage()
            .instance()
            .set(&DataKey::PoolCounter, &next_id);
        env.storage().instance().set(&DataKey::Pool(next_id), &pool);
        let empty_contributions: Vec<Contribution> = Vec::new(&env);
        env.storage()
            .instance()
            .set(&DataKey::Contributions(next_id), &empty_contributions);

        env.events().publish(
            (symbol_short!("pool"), symbol_short!("create"), next_id),
            (owner, target_amount, deadline_ts),
        );

        next_id
    }

    pub fn fund_pool(env: Env, pool_id: u64, contributor: Address, amount: i128) {
        contributor.require_auth();
        assert!(amount > 0, "amount must be positive");

        let mut pool = Self::get_pool(env.clone(), pool_id);
        assert!(!pool.is_closed, "pool already closed");
        assert!(
            env.ledger().timestamp() <= pool.deadline_ts,
            "pool deadline passed"
        );

        pool.total_funded += amount;
        env.storage().instance().set(&DataKey::Pool(pool_id), &pool);

        let mut contributions = Self::get_contributions(env.clone(), pool_id);
        contributions.push_back(Contribution {
            contributor: contributor.clone(),
            amount,
            timestamp: env.ledger().timestamp(),
        });
        env.storage()
            .instance()
            .set(&DataKey::Contributions(pool_id), &contributions);

        env.events().publish(
            (symbol_short!("pool"), symbol_short!("fund"), pool_id),
            (contributor, amount, pool.total_funded),
        );
    }

    pub fn get_pool(env: Env, pool_id: u64) -> FundingPool {
        env.storage()
            .instance()
            .get(&DataKey::Pool(pool_id))
            .unwrap_or_else(|| panic!("pool not found"))
    }

    pub fn get_contributions(env: Env, pool_id: u64) -> Vec<Contribution> {
        if !env.storage().instance().has(&DataKey::Pool(pool_id)) {
            panic!("pool not found");
        }

        env.storage()
            .instance()
            .get(&DataKey::Contributions(pool_id))
            .unwrap_or_else(|| Vec::new(&env))
    }

    pub fn close_pool(env: Env, pool_id: u64) {
        let mut pool = Self::get_pool(env.clone(), pool_id);
        pool.owner.require_auth();
        assert!(!pool.is_closed, "pool already closed");

        pool.is_closed = true;
        env.storage().instance().set(&DataKey::Pool(pool_id), &pool);

        env.events().publish(
            (symbol_short!("pool"), symbol_short!("close"), pool_id),
            (pool.owner, pool.total_funded),
        );
    }
}

mod test;
