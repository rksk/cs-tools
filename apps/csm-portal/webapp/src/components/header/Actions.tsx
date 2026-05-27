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
  Button,
  ColorSchemeToggle,
  Divider,
  Header as HeaderUI,
} from "@wso2/oxygen-ui";
import type { JSX } from "react";
import { useAsgardeo } from "@asgardeo/react";
import { useLogger } from "@hooks/useLogger";

export default function Actions(): JSX.Element {
  const { signOut, isSignedIn } = useAsgardeo();
  const logger = useLogger();

  const handleSignOut = async () => {
    window.dispatchEvent(new CustomEvent("app:signing-out"));
    try {
      await signOut();
    } catch (err) {
      logger.error("Failed to sign out", err);
    }
  };

  return (
    <HeaderUI.Actions>
      <ColorSchemeToggle />
      <Divider
        orientation="vertical"
        flexItem
        sx={{ mx: 1, display: { xs: "none", sm: "block" } }}
      />
      {isSignedIn && (
        <Button size="small" variant="text" onClick={handleSignOut}>
          Sign out
        </Button>
      )}
    </HeaderUI.Actions>
  );
}
