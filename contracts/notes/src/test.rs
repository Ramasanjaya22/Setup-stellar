#![cfg(test)]

use super::{Contract, ContractClient};
use soroban_sdk::{Env, String};

#[test]
fn should_create_and_get_note() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let note = client.create_note(
        &String::from_str(&env, "Belajar Soroban"),
        &String::from_str(&env, "Membuat CRUD pertama"),
    );

    assert_eq!(note.id, 1);

    let fetched = client.get_note(&1).unwrap();
    assert_eq!(fetched.title, String::from_str(&env, "Belajar Soroban"));
    assert_eq!(
        fetched.content,
        String::from_str(&env, "Membuat CRUD pertama")
    );
}

#[test]
fn should_update_and_delete_note() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let first = client.create_note(
        &String::from_str(&env, "Draft"),
        &String::from_str(&env, "Konten lama"),
    );

    let updated = client
        .update_note(
            &first.id,
            &String::from_str(&env, "Final"),
            &String::from_str(&env, "Konten baru"),
        )
        .unwrap();

    assert_eq!(updated.title, String::from_str(&env, "Final"));

    let deleted = client.delete_note(&first.id);
    assert!(deleted);
    assert_eq!(client.get_note(&first.id), None);
}

#[test]
fn should_return_all_notes_in_order() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    client.create_note(&String::from_str(&env, "N1"), &String::from_str(&env, "C1"));
    client.create_note(&String::from_str(&env, "N2"), &String::from_str(&env, "C2"));

    let notes = client.get_notes();
    assert_eq!(notes.len(), 2);
    assert_eq!(notes.get_unchecked(0).title, String::from_str(&env, "N1"));
    assert_eq!(notes.get_unchecked(1).title, String::from_str(&env, "N2"));
}

#[test]
fn should_return_false_when_deleting_missing_note() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    assert!(!client.delete_note(&999));
}

#[test]
fn should_return_none_when_updating_missing_note() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let updated = client.update_note(
        &999,
        &String::from_str(&env, "Nope"),
        &String::from_str(&env, "Not found"),
    );

    assert_eq!(updated, None);
}

#[test]
fn should_return_empty_list_when_no_notes() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let notes = client.get_notes();
    assert_eq!(notes.len(), 0);
}
