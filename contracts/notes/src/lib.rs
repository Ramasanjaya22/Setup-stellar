#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Env, String, Symbol, Vec};

#[contract]
pub struct Contract;

const NOTE_COUNTER: Symbol = symbol_short!("COUNTER");
const NOTE_LIST: Symbol = symbol_short!("NOTES");

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Note {
    pub id: u64,
    pub title: String,
    pub content: String,
}

fn get_note_key(env: &Env, id: u64) -> (Symbol, u64) {
    (symbol_short!("NOTE"), id)
}

fn get_next_id(env: &Env) -> u64 {
    let next = env.storage().instance().get(&NOTE_COUNTER).unwrap_or(0_u64) + 1;
    env.storage().instance().set(&NOTE_COUNTER, &next);
    next
}

fn get_all_ids(env: &Env) -> Vec<u64> {
    env.storage()
        .instance()
        .get(&NOTE_LIST)
        .unwrap_or(Vec::new(env))
}

fn save_all_ids(env: &Env, ids: &Vec<u64>) {
    env.storage().instance().set(&NOTE_LIST, ids);
}

#[contractimpl]
impl Contract {
    pub fn create_note(env: Env, title: String, content: String) -> Note {
        let id = get_next_id(&env);
        let note = Note { id, title, content };

        let key = get_note_key(&env, id);
        env.storage().instance().set(&key, &note);

        let mut ids = get_all_ids(&env);
        ids.push_back(id);
        save_all_ids(&env, &ids);

        note
    }

    pub fn get_note(env: Env, id: u64) -> Option<Note> {
        let key = get_note_key(&env, id);
        env.storage().instance().get(&key)
    }

    pub fn get_notes(env: Env) -> Vec<Note> {
        let ids = get_all_ids(&env);
        let mut notes = Vec::new(&env);

        for id in ids.iter() {
            let key = get_note_key(&env, id);
            if let Some(note) = env.storage().instance().get::<_, Note>(&key) {
                notes.push_back(note);
            }
        }

        notes
    }

    pub fn update_note(env: Env, id: u64, title: String, content: String) -> Option<Note> {
        let key = get_note_key(&env, id);
        if env.storage().instance().has(&key) {
            let note = Note { id, title, content };
            env.storage().instance().set(&key, &note);
            Some(note)
        } else {
            None
        }
    }

    pub fn delete_note(env: Env, id: u64) -> bool {
        let key = get_note_key(&env, id);
        if !env.storage().instance().has(&key) {
            return false;
        }

        env.storage().instance().remove(&key);

        let ids = get_all_ids(&env);
        let mut filtered_ids = Vec::new(&env);
        for item_id in ids.iter() {
            if item_id != id {
                filtered_ids.push_back(item_id);
            }
        }
        save_all_ids(&env, &filtered_ids);

        true
    }
}

mod test;
