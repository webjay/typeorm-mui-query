# MUI TypeORM QueryBuilder

If you use [TypeORM](https://typeorm.io/) and [MUI](https://mui.com/) [Data Grid](https://mui.com/x/react-data-grid/) [server-side filter](https://mui.com/x/react-data-grid/filtering/server-side/) or [server-side sorting](https://mui.com/x/react-data-grid/sorting/#server-side-sorting) this project can be helpful.

## Install

    npm install typeorm-mui-query

## Example

### Frontend

```TSX
const [queryOptions, setQueryOptions] = useState({
  filterModel: {
    items: [],
  },
  sortModel: [],
})

const handleSortModelChange: DataGridProProps['onSortModelChange'] = useCallback((sortModel) => {
  setQueryOptions((currentState) => ({ ...currentState, sortModel }))
}, [])

const handleFilterModelChange: DataGridProProps['onFilterModelChange'] = useCallback(
  (filterModel) => {
    setQueryOptions((currentState) => ({ ...currentState, filterModel }))
  },
  []
)

const query = new URLSearchParams({
  ...queryOptions,
  sortModel: JSON.stringify(queryOptions.sortModel),
  filterModel: JSON.stringify(queryOptions.filterModel),
})
const results = await API.get('default', `/example?${query.toString()}`, {})
```

### Backend

```TypeScript
import { handleQuery } from 'typeorm-mui-query'

handleQuery({ qb, queryStringParameters })
const results = await qb.getMany()
```
