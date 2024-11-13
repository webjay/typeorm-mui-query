import type { SelectQueryBuilder, ObjectLiteral } from "typeorm";
import type { GridFilterModel, GridSortModel } from "@mui/x-data-grid";
import { Brackets } from "typeorm";
import { makeWhere } from "./makeWhere";
import { fieldFormat, invertTableMap } from "./helpers";
import {
  handleQueryStringParameters,
  type QueryStringParameters,
} from "./handleQueryStringParameters";

type HandleFilterAndSortProps = {
  qb: SelectQueryBuilder<ObjectLiteral>;
  tableMap?: Parameters<typeof invertTableMap>[0];
  tableDefault?: string;
  filterModel?: GridFilterModel;
  sortModel?: GridSortModel;
  quickFilterFields?: string[];
  nullsFirst?: boolean;
};

type HandleQueryProps = Omit<
  HandleFilterAndSortProps,
  "filterModel" | "sortModel"
> & {
  queryStringParameters: QueryStringParameters;
};

export function handleFilterModel(
  qb: HandleFilterAndSortProps["qb"],
  filterModel: GridFilterModel,
  tableNameMap: ReturnType<typeof invertTableMap>,
  tableDefault: HandleFilterAndSortProps["tableDefault"],
  quickFilterFields?: HandleFilterAndSortProps["quickFilterFields"]
) {
  const whereStatements: string[] = [];
  const parameters: ObjectLiteral = {};
  filterModel.items.forEach((filterItem) => {
    if (Array.isArray(filterItem.value) && filterItem.value.length === 0) {
      return;
    }
    const parameterName = `p${filterItem.id}`;
    const whereStatement = makeWhere({
      tableName: tableNameMap[filterItem.field] || tableDefault,
      filterItem,
      parameterName,
    });
    if (whereStatement !== false) {
      whereStatements.push(`(${whereStatement})`);
      parameters[parameterName] = filterItem.value;
    }
  });
  if (whereStatements.length > 0) {
    qb.andWhere(
      new Brackets((qb2) => {
        qb2.where(
          whereStatements.join(filterModel.logicOperator ?? " OR "),
          parameters
        );
      })
    );
  }
  if (quickFilterFields && filterModel.quickFilterValues?.length) {
    filterModel.quickFilterValues.forEach((value, index) => {
      const parameterName = `qf${index}`;
      const params = { [parameterName]: value };
      const whereStatement = quickFilterFields
        .map((field) => `${field} ILIKE '%' || :${parameterName} || '%'`)
        .join(" OR ");
      if (filterModel.logicOperator === "or" && index > 0) {
        qb.orWhere(whereStatement, params);
      } else {
        qb.andWhere(whereStatement, params);
      }
    });
  }
}

export function handleSortModel(
  qb: HandleFilterAndSortProps["qb"],
  sortModel: GridSortModel,
  tableNameMap: ReturnType<typeof invertTableMap>,
  tableDefault: HandleFilterAndSortProps["tableDefault"],
  nullsFirst: HandleFilterAndSortProps["nullsFirst"]
) {
  sortModel.forEach(({ field, sort }) =>
    qb.addOrderBy(
      fieldFormat(field, tableNameMap[field] || tableDefault),
      sort?.toUpperCase() as "ASC" | "DESC",
      nullsFirst ? "NULLS FIRST" : "NULLS LAST"
    )
  );
}

export function handleFilterAndSort({
  qb,
  tableMap,
  tableDefault,
  filterModel,
  sortModel,
  quickFilterFields,
  nullsFirst = false,
}: HandleFilterAndSortProps) {
  const tableNameMap = invertTableMap(tableMap);
  if (filterModel) {
    handleFilterModel(
      qb,
      filterModel,
      tableNameMap,
      tableDefault,
      quickFilterFields
    );
  }
  if (sortModel) {
    handleSortModel(qb, sortModel, tableNameMap, tableDefault, nullsFirst);
  }
}

export function handleQuery(props: HandleQueryProps) {
  const { filterModel, sortModel, take, skip, limit, offset } =
    handleQueryStringParameters(props.queryStringParameters);
  handleFilterAndSort({
    ...props,
    filterModel,
    sortModel,
  });
  props.qb.take(take).skip(skip).limit(limit).offset(offset);
}
