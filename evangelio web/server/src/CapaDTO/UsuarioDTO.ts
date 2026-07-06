export interface UsuarioCrearDTO {
  idusuario: string;
  clave: string;
  idperfil: string;
}

export interface UsuarioActualizarDTO {
  clave?: string;
  idperfil: string;
}

export interface UsuarioRespuestaDTO {
  idusuario: string;
  fechaCreacion: string;
  idperfil: string;
  nomPerfil?: string;
}

export interface LoginRequestDTO {
  idusuario: string;
  clave: string;
}

export interface LoginResponseDTO {
  token: string;
  usuario: {
    idusuario: string;
    idperfil: string;
    nomPerfil: string;
  };
}
