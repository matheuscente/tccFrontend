export interface ApiSuccess<T> {
  statusCode: number;
  state: "success";
  data: T[];
}
