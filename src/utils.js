export async function queryDb(query) {
    try {
        const response = await fetch('/sql-query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({dbname: 'text.db', query})
        });

        // Check if the response is OK
        if (!response.ok) throw new Error(`${response.status} - ${response.statusText}`);

        // Parse the JSON response
        const data = await response.json();
        //console.log('Success:', data);
        return data
    } catch (error) {
        console.error(error);
        throw error
    }
}