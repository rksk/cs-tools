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

import { useQuery } from "@tanstack/react-query";
import { useAuthApiClient } from "@hooks/useAuthApiClient";
import { apiConfig } from "@config/apiConfig";
import { ApiError } from "@utils/ApiError";
import type { RecommendedUpdateLevel } from "@features/updates/types/updates";

export function useGetRecommendedUpdateLevels(userEmail: string | undefined) {
  const authFetch = useAuthApiClient();

  return useQuery<RecommendedUpdateLevel[], Error>({
    queryKey: ["updates", "recommended-update-levels", userEmail],
    enabled: Boolean(userEmail),
    queryFn: async () => {
      const url = new URL(`${apiConfig.backendUrl}/updates/recommended-update-levels`);
      url.searchParams.set("user", userEmail as string);
      const res = await authFetch(url.toString());
      if (!res.ok) {
        throw new ApiError(res.status, res.statusText);
      }
      return (await res.json()) as RecommendedUpdateLevel[];
    },
  });
}
