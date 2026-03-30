import { ApiResponseType } from "@ft-transcendence/contracts/util/api";

export type ApiDataAware<T> = {
  data: T | null;
};

export class ApiResponse<T = null>
  implements ApiResponseType, ApiDataAware<T>
{
  public message: string;
  public data: T | null;

  constructor(message: string, data: T | null) {
    this.message = message;
    this.data = data;
  }
}
