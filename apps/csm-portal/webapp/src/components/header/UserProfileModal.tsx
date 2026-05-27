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
  Avatar,
  Box,
  Button,
  Dialog,
  IconButton,
  Skeleton,
  TextField,
  Typography,
} from "@wso2/oxygen-ui";
import { ExternalLink, Lock, PencilLine, X } from "@wso2/oxygen-ui-icons-react";
import { type JSX, useCallback, useEffect, useState } from "react";
import { useAsgardeo } from "@asgardeo/react";
import { useGetUsersMe } from "@features/settings/api/useGetUsersMe";
import { usePatchUsersMe } from "@features/settings/api/usePatchUsersMe";
import { useErrorBanner } from "@context/error-banner/ErrorBannerContext";
import { useSuccessBanner } from "@context/success-banner/SuccessBannerContext";

const PASSWORD_RESET_URL = "https://wso2.com/user/password";

// E.164 phone validator: optional leading +, 8-15 digits.
const E164 = /^\+?[1-9]\d{7,14}$/;

interface AsgardeoUserClaims {
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  username?: string;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function formatLastPasswordUpdate(epochMs: string | undefined): string {
  if (!epochMs) return "Not available";
  const ms = parseInt(epochMs, 10);
  if (Number.isNaN(ms)) return "Not available";
  return new Date(ms).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export interface UserProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export default function UserProfileModal({
  open,
  onClose,
}: UserProfileModalProps): JSX.Element {
  const { user } = useAsgardeo();
  const { data: userMe, isLoading } = useGetUsersMe();
  const patchUserMe = usePatchUsersMe();
  const { showError } = useErrorBanner();
  const { showSuccess } = useSuccessBanner();

  const [phoneDraft, setPhoneDraft] = useState("");
  const [isPhoneEditing, setIsPhoneEditing] = useState(false);

  const claims = (user ?? {}) as AsgardeoUserClaims;
  const fullName =
    claims.name ||
    [claims.given_name, claims.family_name].filter(Boolean).join(" ").trim() ||
    claims.username ||
    claims.email ||
    "Signed in";
  const email = userMe?.email || claims.email || "—";
  const initials = initialsOf(fullName);

  useEffect(() => {
    if (open && userMe) {
      setPhoneDraft(userMe.phoneNumber ?? "");
      setIsPhoneEditing(false);
    }
  }, [open, userMe]);

  const handlePhoneEditCancel = useCallback(() => {
    setPhoneDraft(userMe?.phoneNumber ?? "");
    setIsPhoneEditing(false);
  }, [userMe?.phoneNumber]);

  const handleSave = useCallback(() => {
    const current = userMe?.phoneNumber ?? "";
    const next = phoneDraft.trim();

    if (next === current) {
      onClose();
      return;
    }

    if (next && !E164.test(next)) {
      showError("Phone number must be in E.164 format, e.g. +14155552671.");
      return;
    }

    patchUserMe.mutate(
      { phoneNumber: next },
      {
        onSuccess: () => {
          showSuccess("Profile updated.");
          setIsPhoneEditing(false);
          onClose();
        },
        onError: () => {
          showError("Could not update phone number. Please try again.");
        },
      },
    );
  }, [phoneDraft, userMe?.phoneNumber, patchUserMe, showError, showSuccess, onClose]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6">Profile</Typography>
          <IconButton onClick={onClose} size="small" aria-label="Close">
            <X size={18} />
          </IconButton>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ width: 64, height: 64, fontSize: 24 }}>{initials}</Avatar>
          <Box>
            {isLoading ? (
              <>
                <Skeleton width={180} height={24} />
                <Skeleton width={220} height={18} />
              </>
            ) : (
              <>
                <Typography variant="subtitle1">{fullName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {email}
                </Typography>
              </>
            )}
          </Box>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Phone number
            </Typography>
            {isPhoneEditing ? (
              <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 0.5 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="+14155552671"
                  value={phoneDraft}
                  onChange={(e) => setPhoneDraft(e.target.value)}
                  helperText="E.164 format: + followed by country code and number"
                />
              </Box>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mt: 0.5,
                }}
              >
                <Typography variant="body2">
                  {isLoading ? (
                    <Skeleton width={160} />
                  ) : (
                    userMe?.phoneNumber || "Not set"
                  )}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setIsPhoneEditing(true)}
                  aria-label="Edit phone number"
                >
                  <PencilLine size={16} />
                </IconButton>
              </Box>
            )}
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Last password update
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mt: 0.5,
              }}
            >
              <Typography variant="body2">
                {isLoading ? (
                  <Skeleton width={160} />
                ) : (
                  formatLastPasswordUpdate(userMe?.lastPasswordUpdateTime)
                )}
              </Typography>
              <Button
                size="small"
                variant="text"
                startIcon={<Lock size={14} />}
                endIcon={<ExternalLink size={14} />}
                component="a"
                href={PASSWORD_RESET_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Reset password
              </Button>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
          {isPhoneEditing && (
            <Button variant="text" onClick={handlePhoneEditCancel}>
              Cancel
            </Button>
          )}
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={patchUserMe.isPending}
          >
            {isPhoneEditing ? "Save" : "Close"}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
