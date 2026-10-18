import type { UserRole } from "../Types/UserRole";

export interface UserResponseDTO {
    id: string,
    name: string,
    username: string,
    role: UserRole,
    birthDate: Date,
    createdAt: Date,
    updatedAt: Date

}