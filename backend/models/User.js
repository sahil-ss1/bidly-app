import { query } from '../config/database.js';

export class User {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async findAll() {
    const users = await query('SELECT * FROM users ORDER BY created_at DESC');
    return users.map(user => new User(user));
  }

  static async findById(id) {
    const users = await query('SELECT * FROM users WHERE id = ?', [id]);
    return users.length > 0 ? new User(users[0]) : null;
  }

  static async findByEmail(email) {
    const users = await query('SELECT * FROM users WHERE email = ?', [email]);
    return users.length > 0 ? new User(users[0]) : null;
  }

  static async create(data) {
    const result = await query(
      'INSERT INTO users (name, email) VALUES (?, ?) RETURNING id',
      [data.name, data.email]
    );
    return await User.findById(result[0].id);
  }

  async update(data) {
    await query(
      'UPDATE users SET name = ?, email = ?, updated_at = NOW() WHERE id = ?',
      [data.name || this.name, data.email || this.email, this.id]
    );
    return await User.findById(this.id);
  }

  async delete() {
    await query('DELETE FROM users WHERE id = ?', [this.id]);
  }
}

