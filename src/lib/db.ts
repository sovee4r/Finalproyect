// Simulación de conexión a base de datos
// En el futuro, esto se reemplazará con una conexión real a MySQL

export const db = {
  // Simular una consulta SELECT
  query: async (sql: string, params: any[] = []) => {
    console.log(`Executing SQL: ${sql}`, params);
    
    // Simular latencia de red
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Devolver datos mockeados basados en la consulta
    if (sql.includes('SELECT * FROM users')) {
      return [
        { id: 1, username: 'Player1', level: 5, coins: 1250 },
        { id: 2, username: 'Player2', level: 3, coins: 800 }
      ];
    }
    
    return [];
  }
};

// Ejemplo de uso futuro:
// const users = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
