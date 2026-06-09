use std::{fmt, str::FromStr};

use serde::{Deserialize, Serialize};




#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
#[serde(tag = "access", rename_all = "snake_case")]
pub enum AccessType {
    Public,
    Subscribing,
    Payment,
    PaymentOrSubscribing
}

impl fmt::Display for AccessType {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            AccessType::Public => write!(f, "public"),
            AccessType::Subscribing => write!(f, "subscribing"),
            AccessType::Payment => write!(f, "payment"),
            AccessType::PaymentOrSubscribing => write!(f, "payment_or_subscribing"),
        }
    }
}

impl FromStr for AccessType {

    type Err = ();

    fn from_str(input: &str) -> Result<AccessType, Self::Err> {
        match input {
            "public"  => Ok(AccessType::Public),
            "subscribing"  => Ok(AccessType::Subscribing),
            "payment"  => Ok(AccessType::Payment),
            "payment_or_subscribing" => Ok(AccessType::PaymentOrSubscribing),
            _      => Err(()),
        }
    }
}

impl From<String> for AccessType {
    fn from(access: String) -> Self {
        AccessType::from_str(access.as_str()).unwrap()
    }
}