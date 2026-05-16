import { User, UserRole } from './user.entity';

describe('User Entity', () => {
  it('debería crear un usuario con campos básicos', () => {
    const user = new User();
    user.id = 'u1';
    user.email = 'admin@piedrazul.com';
    user.password = 'hashed-pass';
    user.firstName = 'Admin';
    user.lastName = 'Sistema';

    expect(user).toBeDefined();
    expect(user.id).toBe('u1');
    expect(user.email).toBe('admin@piedrazul.com');
    expect(user.password).toBe('hashed-pass');
    expect(user.firstName).toBe('Admin');
    expect(user.lastName).toBe('Sistema');
  });


  it('debería aceptar keycloakId nullable', () => {
    const user = new User();
    expect(user.keycloakId).toBeUndefined();
    user.keycloakId = 'kc-uuid-1';
    expect(user.keycloakId).toBe('kc-uuid-1');
  });

  it('debería usar UserRole enum', () => {
    expect(UserRole.ADMIN).toBe('admin');
    expect(UserRole.STAFF).toBe('staff');
    expect(UserRole.DOCTOR).toBe('doctor');
  });
});
