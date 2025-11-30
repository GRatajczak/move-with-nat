/** COMMON RESPONSE TYPES **/
/** Standard message response **/
export interface MessageResponse {
  message: string;
}

/** Pagination DTO **/
export interface PaginationMetaDto {
  total: number;
  page: number;
  limit: number;
}

/** Paginated response wrapper **/
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMetaDto;
}
