import type { UserRole } from "../Types/UserRole";

export interface UserResponseDTO {
    id: string,
    name: string,
    username: string,
    email: string,
    role: UserRole,
    birthDate: string,
    createdAt: string,
    updatedAt: string
}

export interface PaginatedUsersDTO {
    items: UserResponseDTO[]
    total: number
    page: number
    pageSize: number
}
