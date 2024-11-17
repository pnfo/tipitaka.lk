use warp::Filter;
use rusqlite::{Connection};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Deserialize)]
struct Query {
    sql: String,
}

#[derive(Serialize)]
struct Row {
    columns: Vec<String>,
    values: Vec<String>,
}

#[tokio::main]
async fn main() {
    println!("Hello World!");
    let db_path = Arc::new(":memory:".to_string());

    let post_handler = warp::post()
        .and(warp::path("query"))
        .and(warp::body::json())
        .and(with_db_path(db_path.clone()))
        .and_then(handle_query);

    warp::serve(post_handler).run(([127, 0, 0, 1], 3030)).await;
}

fn with_db_path(
    db_path: Arc<String>,
) -> impl Filter<Extract = (Arc<String>,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || db_path.clone())
}

async fn handle_query(
    query: Query,
    db_path: Arc<String>,
) -> Result<impl warp::Reply, warp::Rejection> {
    let conn = Connection::open(&**db_path).unwrap(); // New connection per request
    let mut stmt = conn.prepare(&query.sql).unwrap();
    let column_count = stmt.column_count();

    // Collect column names outside of the closure
    let column_names: Vec<String> = (0..column_count)
        .map(|i| stmt.column_name(i).unwrap().to_string())
        .collect();

    let rows = stmt.query_map([], |row| {
        let values: Vec<String> = (0..column_count)
            .map(|i| row.get::<usize, String>(i).unwrap_or_default())
            .collect();

        Ok(Row { 
            columns: column_names.clone(),  // Use the pre-collected column names
            values,
        })
    }).unwrap();

    let results: Vec<Row> = rows.map(|r| r.unwrap()).collect();
    Ok(warp::reply::json(&results))
}
