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
  Box,
  ColorSchemeToggle,
  Divider,
  Header as HeaderUI,
  UserMenu,
} from "@wso2/oxygen-ui";
import { LogOut } from "@wso2/oxygen-ui-icons-react";
import type { JSX } from "react";
import { useAsgardeo } from "@asgardeo/react";
import { useLogger } from "@hooks/useLogger";

interface AsgardeoUserClaims {
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  username?: string;
  sub?: string;
}

export default function Actions(): JSX.Element {
  const { signOut, isSignedIn, user } = useAsgardeo();
  const logger = useLogger();

  const handleSignOut = async () => {
    window.dispatchEvent(new CustomEvent("app:signing-out"));
    try {
      await signOut();
    } catch (err) {
      logger.error("Failed to sign out", err);
    }
  };

  const claims = (user ?? {}) as AsgardeoUserClaims;
  const fullName =
    claims.name ||
    [claims.given_name, claims.family_name].filter(Boolean).join(" ").trim() ||
    claims.username ||
    claims.email ||
    "Signed in";
  const email = claims.email ?? "";

  return (
    <HeaderUI.Actions>
      <ColorSchemeToggle />
      <Divider
        orientation="vertical"
        flexItem
        sx={{
          mx: 1,
          display: { xs: "none", sm: "block" },
          visibility: isSignedIn ? "visible" : "hidden",
        }}
      />
      {isSignedIn ? (
        <UserMenu>
          <UserMenu.Trigger name={fullName} />
          <UserMenu.Header name={fullName} email={email} />
          <UserMenu.Divider />
          <UserMenu.Logout
            icon={<LogOut size={16} />}
            label="Sign out"
            onClick={handleSignOut}
          />
        </UserMenu>
      ) : (
        <Box sx={{ width: 40, height: 40 }} />
      )}
    </HeaderUI.Actions>
  );
}
