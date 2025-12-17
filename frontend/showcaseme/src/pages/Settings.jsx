import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import "./Settings.css";

import {
    AppLayout, ContentLayout, Header, Box, SpaceBetween, Container,
    Form, FormField, Input, Select, Button, StatusIndicator
} from "@cloudscape-design/components";

import { useNavigate } from "react-router-dom";

export default function Settings() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState(null);

    const [form, setForm] = useState({
        username: "",
        email: "",
        currentPassword: "",
        newPassword: "",
        privacy: "public",
        tier: "free"
    });

    // Load current user + profile settings
    useEffect(() => {
        const load = async () => {
            try {
                const sessionRes = await fetch("/api/session", {
                    credentials: "include"
                });
                const sessionJson = await sessionRes.json();

                if (!sessionRes.ok || sessionJson.status !== "success") {
                    navigate("/login");
                    return;
                }

                const profileRes = await fetch("/api/profile", {
                    credentials: "include"
                });
                const profileJson = await profileRes.json();

                setForm({
                    username: sessionJson.username,
                    email: sessionJson.email,
                    currentPassword: "",
                    newPassword: "",
                    privacy: profileJson.profile?.privacy || "public",
                    tier: profileJson.profile?.tier || "free"
                });
            } catch (err) {
                console.error("Settings load error:", err);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [navigate]);

    // Save function
    const handleSave = async () => {
        setSaving(true);
        setStatus(null);

        try {
            const res = await fetch("/api/settings/account", {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: form.username,
                    email: form.email,
                    currentPassword: form.currentPassword || null,
                    newPassword: form.newPassword || null,
                    tier: form.tier,
                    privacy: form.privacy
                })
            });

            const json = await res.json().catch(() => ({}));

            if (!res.ok || json.status !== "success") {
                setStatus({ type: "error", message: json.message || "Save failed." });
                return;
            }

            setForm((f) => ({ ...f, currentPassword: "", newPassword: "" }));
            setStatus({ type: "success", message: "Settings updated successfully." });
        } catch (err) {
            console.error("Save error:", err);
            setStatus({ type: "error", message: "Unexpected error saving settings." });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="settings-loading">Loading settings…</div>;
    }

    return (
        <>
            <Navbar />
            <div className="app-under-navbar">
                <AppLayout
                    navigationHide
                    toolsHide
                    content={
                        <div className="settings-page">
                            <ContentLayout
                                header={
                                    <Header
                                        variant="h1"
                                        description="Manage your account preferences"
                                    >
                                        Settings
                                    </Header>
                                }
                            >
                                <SpaceBetween size="l">

                                    {/* ACCOUNT INFO */}
                                    <Container header={<Header variant="h2">Account</Header>}>
                                        <Form>
                                            <SpaceBetween size="m">
                                                <FormField label="Username">
                                                    <Input
                                                        value={form.username}
                                                        onChange={(e) =>
                                                            setForm((f) => ({
                                                                ...f,
                                                                username: e.detail.value
                                                            }))
                                                        }
                                                    />
                                                </FormField>

                                                <FormField label="Email">
                                                    <Input
                                                        value={form.email}
                                                        type="email"
                                                        onChange={(e) =>
                                                            setForm((f) => ({
                                                                ...f,
                                                                email: e.detail.value
                                                            }))
                                                        }
                                                    />
                                                </FormField>
                                            </SpaceBetween>
                                        </Form>
                                    </Container>

                                    {/* PASSWORD */}
                                    <Container header={<Header variant="h2">Password</Header>}>
                                        <SpaceBetween size="m">
                                            <FormField label="Current password">
                                                <Input
                                                    type="password"
                                                    value={form.currentPassword}
                                                    onChange={(e) =>
                                                        setForm((f) => ({
                                                            ...f,
                                                            currentPassword: e.detail.value
                                                        }))
                                                    }
                                                />
                                            </FormField>

                                            <FormField label="New password">
                                                <Input
                                                    type="password"
                                                    value={form.newPassword}
                                                    onChange={(e) =>
                                                        setForm((f) => ({
                                                            ...f,
                                                            newPassword: e.detail.value
                                                        }))
                                                    }
                                                />
                                            </FormField>
                                        </SpaceBetween>
                                    </Container>

                                    {/* PRIVACY */}
                                    <Container header={<Header variant="h2">Privacy</Header>}>
                                        <FormField label="Portfolio visibility">
                                            <Select
                                                selectedOption={{
                                                    label: form.privacy === "public" ? "Public" : "Private",
                                                    value: form.privacy
                                                }}
                                                options={[
                                                    { label: "Public", value: "public" },
                                                    { label: "Private", value: "private" }
                                                ]}
                                                onChange={({ detail }) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        privacy: detail.selectedOption.value
                                                    }))
                                                }
                                            />
                                        </FormField>
                                    </Container>

                                    {/* TIER */}
                                    <Container header={<Header variant="h2">Subscription</Header>}>
                                        <FormField label="Account tier">
                                            <Select
                                                selectedOption={{
                                                    label:
                                                        form.tier === "premium"
                                                            ? "Premium"
                                                            : "Free",
                                                    value: form.tier
                                                }}
                                                options={[
                                                    { label: "Free", value: "free" },
                                                    { label: "Premium", value: "premium" }
                                                ]}
                                                onChange={({ detail }) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        tier: detail.selectedOption.value
                                                    }))
                                                }
                                            />
                                        </FormField>
                                    </Container>

                                    {/* STATUS */}
                                    {status && (
                                        <StatusIndicator
                                            type={status.type === "success" ? "success" : "error"}
                                        >
                                            {status.message}
                                        </StatusIndicator>
                                    )}

                                    {/* ACTIONS */}
                                    <Box float="right">
                                        <Button
                                            variant="primary"
                                            loading={saving}
                                            onClick={handleSave}
                                        >
                                            Save changes
                                        </Button>
                                    </Box>

                                </SpaceBetween>
                            </ContentLayout>
                        </div>
                    }
                />
            </div>
        </>
    );
}