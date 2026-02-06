export type EstadoApi = 'OK' | 'ERR';

export interface ApiResponse<T> {
  estado: EstadoApi;
  mensaje: string;
  resultado?: T; // solo cuando estado === 'OK'
}

export interface LoginPayload {
  numeroIdentificacion: string;
  password: string;
}

export interface UsuarioSesion {
  id: number;
  numeroIdentificacion: string;
  nombreCompleto: string;
  email: string | null;
}

export interface LoginResultado {
  token_type: 'Bearer';
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
  usuario: {
    id: number;
    numero_identificacion: string;
    nombre_completo: string;
    email: string | null;
  };
  sesion: {
    id: number;
    sesion_activa_anterior: boolean;
  };
}

export interface RefreshResultado {
  token_type: 'Bearer';
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
}

export interface MeResultado {
  usuario: {
    id: number;
    numero_identificacion: string;
    nombre_completo: string;
    email: string | null;
  };
}
