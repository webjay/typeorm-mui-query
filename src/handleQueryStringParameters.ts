import type { GridFilterModel, GridSortModel } from "@mui/x-data-grid";

export type QueryStringParameters = Record<string, unknown> | undefined | null;

type Result = {
  limit?: number;
  offset?: number;
  take?: number;
  skip?: number;
  filterModel?: GridFilterModel;
  sortModel?: GridSortModel;
};

type PaginationParameters = (string &
  keyof Omit<Result, "filterModel" | "sortModel">)[];

const paginationParameters: PaginationParameters = [
  "limit",
  "offset",
  "take",
  "skip",
];

const initParameters = {
  sortModel: [] as GridSortModel,
  filterModel: { items: [] } as GridFilterModel,
};

export function handleQueryStringParameters(
  queryStringParameters: QueryStringParameters,
  defaultParameters = initParameters
): Result {
  if (!queryStringParameters) {
    return defaultParameters;
  }
  const definedParameters: Result = { ...defaultParameters };
  paginationParameters.forEach((parameter) => {
    if (queryStringParameters[parameter] !== undefined) {
      definedParameters[parameter] = Number(queryStringParameters[parameter]);
    }
  });
  if (
    queryStringParameters.sortModel !== undefined &&
    typeof queryStringParameters.sortModel === "string"
  ) {
    definedParameters.sortModel = JSON.parse(queryStringParameters.sortModel);
  }
  if (
    queryStringParameters.filterModel !== undefined &&
    typeof queryStringParameters.filterModel === "string"
  ) {
    definedParameters.filterModel = JSON.parse(
      queryStringParameters.filterModel
    );
  }
  return definedParameters;
}
