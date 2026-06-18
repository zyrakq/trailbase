use trailbase_wasm::http::{HttpError, StatusCode};

pub(crate) fn internal(err: impl std::string::ToString) -> HttpError {
    return HttpError::message(StatusCode::INTERNAL_SERVER_ERROR, err);
}

pub(crate) fn bad_request(err: impl std::string::ToString) -> HttpError {
    return HttpError::message(StatusCode::BAD_REQUEST, err);
}