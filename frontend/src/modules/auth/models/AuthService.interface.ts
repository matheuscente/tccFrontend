import type { HttpResponse } from "../../../services/api/models/httpResponse.dto";
import type { Login } from "./login.dto";

interface AuthServiceInterface {
    login(username: string, password: string): Promise<HttpResponse<Login>>
    logout(): Promise<HttpResponse<{}>>
}

export {
    type AuthServiceInterface
}