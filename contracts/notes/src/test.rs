#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

#[test]
fn create_and_fund_pool() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let contributor = Address::generate(&env);

    let deadline = env.ledger().timestamp() + 100;
    let pool_id = client.create_pool(&owner, &1_000, &deadline);
    client.fund_pool(&pool_id, &contributor, &250);

    let pool = client.get_pool(&pool_id);
    assert_eq!(pool.id, pool_id);
    assert_eq!(pool.total_funded, 250);
    assert!(!pool.is_closed);

    let contributions = client.get_contributions(&pool_id);
    assert_eq!(contributions.len(), 1);
    assert_eq!(contributions.get(0).unwrap().amount, 250);
}

#[test]
fn cannot_fund_with_zero_amount() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let contributor = Address::generate(&env);

    let deadline = env.ledger().timestamp() + 100;
    let pool_id = client.create_pool(&owner, &1_000, &deadline);

    let result = std::panic::catch_unwind(|| client.fund_pool(&pool_id, &contributor, &0));
    assert!(result.is_err());
}

#[test]
fn close_pool_blocks_funding() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let contributor = Address::generate(&env);

    let deadline = env.ledger().timestamp() + 100;
    let pool_id = client.create_pool(&owner, &1_000, &deadline);
    client.close_pool(&pool_id);

    let pool = client.get_pool(&pool_id);
    assert!(pool.is_closed);

    let result = std::panic::catch_unwind(|| client.fund_pool(&pool_id, &contributor, &100));
    assert!(result.is_err());
}
