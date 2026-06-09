use std::{fs, io};

use actix_multipart::form::tempfile::TempFile;

use regex::Regex;

use thiserror::Error;

#[derive(Error, Debug)]
pub enum AvatarError {
    #[error("Only supported formats: jpeg, jpg, png")]
    InvalidFileFormat,
}



fn validate(
    temp_file: &TempFile
) -> anyhow::Result<()> {
    let re = Regex::new(r#"\b(jpe?g|png)\b"#).unwrap();

    let file_ext = temp_file.content_type.clone();
    if file_ext.is_none() || !re.is_match(file_ext.unwrap().subtype().as_str()) {
        return Err(AvatarError::InvalidFileFormat.into());
    }

    Ok(())
}

pub fn get_filename(
    temp_file: &TempFile,
    sub: &str,
) -> String {
    let file_name =  temp_file.file_name.clone().unwrap();
    format!("{}/{}", sub, file_name)
}



pub async fn save_file(
    temp_file: TempFile,
    sub: &str,

) -> anyhow::Result<()> {

    validate(&temp_file)?;

    std::fs::create_dir_all(format!("/tmp/static/{}", sub))?;
    
    let path = format!("/tmp/static/{}", get_filename(&temp_file, sub));
    temp_file.file.persist(path)?;
    Ok(())
}

pub fn delete_dir(sub: &str) -> Result<(), io::Error> {

    let path = format!("/tmp/static/{}", sub);

    Ok(fs::remove_dir_all(path)?)
}