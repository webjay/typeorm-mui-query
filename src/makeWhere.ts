import type { GridFilterItem } from "@mui/x-data-grid";
import { fieldFormat, cast } from "./helpers";

type MakeWhereProps = {
  tableName?: string;
  filterItem: GridFilterItem;
  parameterName: string;
};

function handleNoValue(
  fieldFormatted: string,
  operator: string,
  parameterName: string,
  value?: string | string[],
  condition: "IS NULL" | "IS NOT NULL" = "IS NULL"
) {
  if (!value) {
    return `${fieldFormatted} ${condition}`;
  }
  return `${fieldFormatted} ${operator} :${parameterName}${cast(value)}`;
}

export function makeWhere({
  tableName,
  filterItem: { field, operator, value },
  parameterName,
}: MakeWhereProps): string | false {
  switch (operator) {
    // number
    case "=":
    case "!=":
    case ">":
    case ">=":
    case "<":
    case "<=":
      if (!value) return false;
      return `${fieldFormat(
        field,
        tableName
      )} ${operator} :${parameterName}::int`;
    // common
    case "contains":
      if (!value) return false;
      return `${fieldFormat(
        field,
        tableName
      )} ILIKE '%' || :${parameterName} || '%'`;
    case "equals":
      if (!value) return false;
      return `${fieldFormat(field, tableName)} = :${parameterName}`;
    case "startsWith":
      if (!value) return false;
      return `${fieldFormat(field, tableName)} ILIKE :${parameterName} || '%'`;
    case "endsWith":
      if (!value) return false;
      return `${fieldFormat(field, tableName)} ILIKE '%' || :${parameterName}`;
    case "isEmpty":
      return `${fieldFormat(field, tableName)} IS NULL`;
    case "isNotEmpty":
      return `${fieldFormat(field, tableName)} IS NOT NULL`;
    case "isAnyOf":
      if (!value) return false;
      return `${fieldFormat(field, tableName)} IN(:...${parameterName})`;
    // date | selectable
    case "is":
      return handleNoValue(
        fieldFormat(field, tableName),
        "=",
        parameterName,
        value
      );
    case "not":
      return handleNoValue(
        fieldFormat(field, tableName),
        "!=",
        parameterName,
        value,
        "IS NOT NULL"
      );
    case "after":
      if (!value) return false;
      return `${fieldFormat(field, tableName)} > :${parameterName}${cast(
        value
      )}`;
    case "onOrAfter":
      if (!value) return false;
      return `${fieldFormat(field, tableName)} >= :${parameterName}${cast(
        value
      )}`;
    case "before":
      if (!value) return false;
      return `${fieldFormat(field, tableName)} < :${parameterName}${cast(
        value
      )}`;
    case "onOrBefore":
      if (!value) return false;
      return `${fieldFormat(field, tableName)} <= :${parameterName}${cast(
        value
      )}`;
    default:
      console.warn("Unknown operator: %s", operator);
      return `${fieldFormat(field, tableName)} ${operator} :${parameterName}`;
  }
}
