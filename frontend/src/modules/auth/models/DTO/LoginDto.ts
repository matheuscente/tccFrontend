export interface LoginDTO {
    username: string,
    password: string
}

export interface LoginResponseDTO {
    accessToken: string,
    sessionExpiresAt: number
}
