// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@wso2/oxygen-ui";
import { type JSX, useCallback, useMemo, useState } from "react";
import type { SelectChangeEvent } from "@wso2/oxygen-ui";
import { useAsgardeo } from "@asgardeo/react";
import { useGetProductUpdateLevels } from "@features/updates/api/useGetProductUpdateLevels";
import { useGetRecommendedUpdateLevels } from "@features/updates/api/useGetRecommendedUpdateLevels";
import { usePostUpdateLevelsSearch } from "@features/updates/api/usePostUpdateLevelsSearch";
import type {
  ProductUpdateLevel,
  SearchUpdatesPayload,
  UpdateDescription,
} from "@features/updates/types/updates";

interface FilterState {
  productName: string;
  productVersion: string;
  startLevel: string;
  endLevel: string;
}

const INITIAL_FILTER: FilterState = {
  productName: "",
  productVersion: "",
  startLevel: "",
  endLevel: "",
};

function getProductNames(data: ProductUpdateLevel[] | undefined): string[] {
  if (!data) return [];
  return Array.from(new Set(data.map((p) => p.productName))).sort();
}

function getVersionsForProduct(
  data: ProductUpdateLevel[] | undefined,
  productName: string,
): string[] {
  if (!data || !productName) return [];
  const product = data.find((p) => p.productName === productName);
  if (!product) return [];
  return Array.from(
    new Set(product.productUpdateLevels.map((v) => v.productBaseVersion)),
  ).sort();
}

function getLevelsForVersion(
  data: ProductUpdateLevel[] | undefined,
  productName: string,
  productVersion: string,
): number[] {
  if (!data || !productName || !productVersion) return [];
  const product = data.find((p) => p.productName === productName);
  if (!product) return [];
  const version = product.productUpdateLevels.find(
    (v) => v.productBaseVersion === productVersion,
  );
  return version ? [...version.updateLevels].sort((a, b) => a - b) : [];
}

function chipColorForType(updateType: string): "error" | "warning" | "default" {
  const t = updateType.toLowerCase();
  if (t.includes("security")) return "error";
  if (t.includes("regular")) return "warning";
  return "default";
}

function UpdateCard({ desc }: { desc: UpdateDescription }): JSX.Element {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          sx={{ mb: 1 }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="subtitle1">
              Update {desc.updateLevel}
            </Typography>
            <Chip
              size="small"
              label={desc.updateType}
              color={chipColorForType(desc.updateType)}
              variant="outlined"
            />
          </Box>
          <Typography variant="caption" color="text.secondary">
            {new Date(desc.timestamp).toLocaleDateString()}
          </Typography>
        </Stack>
        {desc.description && (
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mb: 1 }}>
            {desc.description}
          </Typography>
        )}
        {desc.securityAdvisories && desc.securityAdvisories.length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" color="text.secondary">
              {desc.securityAdvisories.length} security advisor
              {desc.securityAdvisories.length === 1 ? "y" : "ies"}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function CsmUpdatesPage(): JSX.Element {
  const { user } = useAsgardeo();
  const userEmail = (user as { email?: string } | undefined)?.email;

  const [filter, setFilter] = useState<FilterState>(INITIAL_FILTER);
  const [search, setSearch] = useState<SearchUpdatesPayload | null>(null);

  const productLevels = useGetProductUpdateLevels();
  const recommended = useGetRecommendedUpdateLevels(userEmail);
  const searchResult = usePostUpdateLevelsSearch(search);

  const productNames = useMemo(
    () => getProductNames(productLevels.data),
    [productLevels.data],
  );
  const versionOptions = useMemo(
    () => getVersionsForProduct(productLevels.data, filter.productName),
    [productLevels.data, filter.productName],
  );
  const startLevelOptions = useMemo(
    () => getLevelsForVersion(productLevels.data, filter.productName, filter.productVersion),
    [productLevels.data, filter.productName, filter.productVersion],
  );
  const endLevelOptions = useMemo(() => {
    if (!filter.startLevel || startLevelOptions.length === 0) return [];
    const start = Number(filter.startLevel);
    return startLevelOptions.filter((l) => l > start);
  }, [startLevelOptions, filter.startLevel]);

  const handleFilterChange =
    (field: keyof FilterState) => (e: SelectChangeEvent<string>) => {
      const value = String(e.target.value);
      setFilter((prev) => {
        const next = { ...prev, [field]: value };
        if (field === "productName") {
          next.productVersion = "";
          next.startLevel = "";
          next.endLevel = "";
        } else if (field === "productVersion") {
          next.startLevel = "";
          next.endLevel = "";
        } else if (field === "startLevel") {
          next.endLevel = "";
        }
        return next;
      });
    };

  const canSearch =
    filter.productName !== "" &&
    filter.productVersion !== "" &&
    filter.startLevel !== "" &&
    filter.endLevel !== "" &&
    Number(filter.endLevel) > Number(filter.startLevel);

  const handleSearch = useCallback(() => {
    if (!canSearch) return;
    setSearch({
      productName: filter.productName,
      productVersion: filter.productVersion,
      startingUpdateLevel: Number(filter.startLevel),
      endingUpdateLevel: Number(filter.endLevel),
    });
  }, [canSearch, filter]);

  const handleClear = useCallback(() => {
    setFilter(INITIAL_FILTER);
    setSearch(null);
  }, []);

  const sortedSearchKeys = useMemo(() => {
    if (!searchResult.data) return [];
    return Object.keys(searchResult.data).sort((a, b) => Number(b) - Number(a));
  }, [searchResult.data]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h5">Updates</Typography>

      {/* Recommended for me */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Recommended for you
          </Typography>
          {!userEmail ? (
            <Typography variant="body2" color="text.secondary">
              Sign in to see recommendations.
            </Typography>
          ) : recommended.isLoading ? (
            <CircularProgress size={20} />
          ) : recommended.isError ? (
            <Alert severity="error">
              Could not load recommendations: {recommended.error.message}
            </Alert>
          ) : !recommended.data || recommended.data.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No recommended updates for {userEmail}.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {recommended.data.map((r) => (
                <Paper
                  key={`${r.productName}-${r.productBaseVersion}`}
                  variant="outlined"
                  sx={{ p: 1.5, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}
                >
                  <Box>
                    <Typography variant="body2">
                      <strong>{r.productName}</strong> {r.productBaseVersion}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Installed {r.endingUpdateLevel} · Recommended {r.recommendedUpdateLevel}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {r.availableUpdatesCount > 0 && (
                      <Chip size="small" label={`${r.availableUpdatesCount} available`} variant="outlined" />
                    )}
                    {r.availableSecurityUpdatesCount > 0 && (
                      <Chip
                        size="small"
                        color="error"
                        label={`${r.availableSecurityUpdatesCount} security`}
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Search */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Search updates between levels
          </Typography>
          {productLevels.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Could not load product catalog.
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small" disabled={productLevels.isLoading}>
                <InputLabel id="upd-product">Product</InputLabel>
                <Select
                  labelId="upd-product"
                  value={filter.productName}
                  label="Product"
                  onChange={handleFilterChange("productName")}
                >
                  {productNames.map((n) => (
                    <MenuItem key={n} value={n}>{n}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small" disabled={!filter.productName}>
                <InputLabel id="upd-version">Version</InputLabel>
                <Select
                  labelId="upd-version"
                  value={filter.productVersion}
                  label="Version"
                  onChange={handleFilterChange("productVersion")}
                >
                  {versionOptions.map((v) => (
                    <MenuItem key={v} value={v}>{v}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small" disabled={!filter.productVersion}>
                <InputLabel id="upd-start">Start level</InputLabel>
                <Select
                  labelId="upd-start"
                  value={filter.startLevel}
                  label="Start level"
                  onChange={handleFilterChange("startLevel")}
                >
                  {startLevelOptions.map((l) => (
                    <MenuItem key={l} value={String(l)}>{l}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small" disabled={!filter.startLevel}>
                <InputLabel id="upd-end">End level</InputLabel>
                <Select
                  labelId="upd-end"
                  value={filter.endLevel}
                  label="End level"
                  onChange={handleFilterChange("endLevel")}
                >
                  {endLevelOptions.map((l) => (
                    <MenuItem key={l} value={String(l)}>{l}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button variant="contained" onClick={handleSearch} disabled={!canSearch}>
              Search
            </Button>
            <Button variant="text" onClick={handleClear}>Clear</Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Results */}
      {search && (
        <Box>
          {searchResult.isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : searchResult.isError ? (
            <Alert severity="error">
              Could not load updates: {searchResult.error.message}
            </Alert>
          ) : !searchResult.data || sortedSearchKeys.length === 0 ? (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
              No updates found between level {search.startingUpdateLevel} and {search.endingUpdateLevel}.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {sortedSearchKeys.flatMap((key) => {
                const group = searchResult.data![key];
                return group.updateDescriptionLevels.map((desc) => (
                  <UpdateCard key={`${key}-${desc.updateNumber}`} desc={desc} />
                ));
              })}
            </Stack>
          )}
        </Box>
      )}
    </Box>
  );
}
