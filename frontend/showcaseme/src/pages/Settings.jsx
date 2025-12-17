import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import "./Settings.css";
import {
    AppLayout, ContentLayout, Header, Box, SpaceBetween, Container,
    Form, FormField, Input, Select, Button, StatusIndicator, Modal
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

    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
    const [checkoutStatus, setCheckoutStatus] = useState(null);
    const [checkoutDone, setCheckoutDone] = useState(false);

    const [payment, setPayment] = useState({
        cardName: "",
        cardNumber: "",
        exp: "",
        cvc: "",
        zip: ""
    });
    
    const [mfaEnabled, setMfaEnabled] = useState(false);
    const [mfaModalOpen, setMfaModalOpen] = useState(false);
    const [mfaLoading, setMfaLoading] = useState(false);
    const [mfaSetup, setMfaSetup] = useState(null); // { qr, secret }
    const [mfaCode, setMfaCode] = useState("");
    const [mfaStatus, setMfaStatus] = useState(null); // { type, message }


    // Load current user + profile settings
    useEffect(() => {
        const load = async () => {
            try {
                const sessionRes = await fetch("/api/session", { credentials: "include" });
                const sessionJson = await sessionRes.json();

                if (!sessionRes.ok || sessionJson.status !== "success") {
                    navigate("/login");
                    return;
                }

                const profileRes = await fetch("/api/profile", { credentials: "include" });
                const profileJson = await profileRes.json();
                
                const mfaRes = await fetch("/api/mfa/status", { credentials: "include" });
                const mfaJson = await mfaRes.json().catch(() => ({}));
                if (mfaRes.ok && mfaJson.status === "success") {
                    setMfaEnabled(!!mfaJson.enabled);
                }

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

    const resetCheckout = () => {
        setCheckoutDone(false);
        setCheckoutSubmitting(false);
        setCheckoutStatus(null);
        setPayment({
            cardName: "",
            cardNumber: "",
            exp: "",
            cvc: "",
            zip: ""
        });
    };

    const closeCheckoutAndRevert = () => {
        setCheckoutOpen(false);
        resetCheckout();
        setForm((f) => ({ ...f, tier: "free" }));
    };

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

    const handleTierChange = (nextTier) => {
        // If user selects premium, open checkout first
        if (nextTier === "premium") {
            setForm((f) => ({ ...f, tier: "free" }));
            resetCheckout();
            setCheckoutOpen(true);
            return;
        }

        // If they select free, just set it
        setForm((f) => ({ ...f, tier: "free" }));
    };

    const submitPayment = async () => {
        setCheckoutSubmitting(true);
        setCheckoutStatus(null);

        // Validation
        const cardNumberDigits = String(payment.cardNumber || "").replace(/\D/g, "");
        const expOk = /^\d{2}\/\d{2}$/.test(String(payment.exp || "").trim());
        const cvcOk = /^\d{3,4}$/.test(String(payment.cvc || "").trim());

        if (!String(payment.cardName || "").trim()) {
            setCheckoutSubmitting(false);
            setCheckoutStatus({ type: "error", message: "Please enter the name on card." });
            return;
        }
        if (cardNumberDigits.length < 12) {
            setCheckoutSubmitting(false);
            setCheckoutStatus({ type: "error", message: "Please enter a valid card number." });
            return;
        }
        if (!expOk) {
            setCheckoutSubmitting(false);
            setCheckoutStatus({ type: "error", message: "Expiration must be in MM/YY format." });
            return;
        }
        if (!cvcOk) {
            setCheckoutSubmitting(false);
            setCheckoutStatus({ type: "error", message: "CVC must be 3–4 digits." });
            return;
        }

        // Processing delay
        await new Promise((r) => setTimeout(r, 700));

        setCheckoutSubmitting(false);
        setCheckoutDone(true);
        setForm((f) => ({ ...f, tier: "premium" }));

        // Modal success message
        setCheckoutStatus({ type: "success", message: "Purchased! Premium is selected." });

        // Page-level message
        setStatus({ type: "success", message: "Purchased! Premium is selected. Click Save changes to apply." });
    };

    const openMfaSetup = async () => {
        setMfaModalOpen(true);
        setMfaStatus(null);
        setMfaSetup(null);
        setMfaCode("");
        setMfaLoading(true);

        try {
            const res = await fetch("/api/mfa/setup", {
                method: "POST",
                credentials: "include"
            });

            const json = await res.json().catch(() => ({}));
            if (!res.ok || json.status !== "success") {
                setMfaStatus({ type: "error", message: json.message || "Failed to start MFA setup." });
                return;
            }

            setMfaSetup({
                qr: json.qr,
                secret: json.secret
            });
        } catch (err) {
            console.error("MFA setup error:", err);
            setMfaStatus({ type: "error", message: "Failed to start MFA setup." });
        } finally {
            setMfaLoading(false);
        }
    };

    const verifyMfaSetup = async () => {
        setMfaStatus(null);

        const code = String(mfaCode || "").trim();
        if (!code) {
            setMfaStatus({ type: "error", message: "Enter the 6-digit code from your authenticator app." });
            return;
        }

        setMfaLoading(true);
        try {
            const res = await fetch("/api/mfa/verify-setup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ code })
            });

            const json = await res.json().catch(() => ({}));
            if (!res.ok || json.status !== "success") {
                setMfaStatus({ type: "error", message: json.message || "Invalid code." });
                return;
            }

            setMfaEnabled(true);
            setMfaStatus({ type: "success", message: "MFA enabled successfully." });

            // Optional: close after success
            setTimeout(() => {
                setMfaModalOpen(false);
                setMfaSetup(null);
                setMfaCode("");
                setMfaStatus(null);
            }, 700);
        } catch (err) {
            console.error("MFA verify error:", err);
            setMfaStatus({ type: "error", message: "Failed to verify MFA." });
        } finally {
            setMfaLoading(false);
        }
    };

    const disableMfa = async () => {
        setMfaStatus(null);
        setMfaLoading(true);

        try {
            const res = await fetch("/api/mfa/disable", {
                method: "POST",
                credentials: "include"
            });

            const json = await res.json().catch(() => ({}));
            if (!res.ok || json.status !== "success") {
                setStatus({ type: "error", message: json.message || "Failed to disable MFA." });
                return;
            }

            setMfaEnabled(false);
            setStatus({ type: "success", message: "MFA disabled." });
        } catch (err) {
            console.error("MFA disable error:", err);
            setStatus({ type: "error", message: "Failed to disable MFA." });
        } finally {
            setMfaLoading(false);
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
                                    <Header variant="h1" description="Manage your account preferences">
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
                                                    label: form.tier === "premium" ? "Premium" : "Free",
                                                    value: form.tier
                                                }}
                                                options={[
                                                    { label: "Free", value: "free" },
                                                    { label: "Premium", value: "premium" }
                                                ]}
                                                onChange={({ detail }) => handleTierChange(detail.selectedOption.value)}
                                            />
                                        </FormField>
                                    </Container>

                                    {/* MFA */}
                                    <Container header={<Header variant="h2">Multi-Factor Authentication (MFA)</Header>}>
                                        <SpaceBetween size="m">
                                            <Box color="text-body-secondary">
                                                Add an extra layer of security. You will need a 6-digit code from an authenticator app when logging in.
                                            </Box>

                                            <StatusIndicator type={mfaEnabled ? "success" : "info"}>
                                                {mfaEnabled ? "Enabled" : "Not enabled"}
                                            </StatusIndicator>

                                            <SpaceBetween direction="horizontal" size="s">
                                                {!mfaEnabled ? (
                                                    <Button variant="primary" onClick={openMfaSetup} loading={mfaLoading}>
                                                        Enable MFA
                                                    </Button>
                                                ) : (
                                                    <Button onClick={disableMfa} loading={mfaLoading}>
                                                        Disable MFA
                                                    </Button>
                                                )}
                                            </SpaceBetween>
                                        </SpaceBetween>
                                    </Container>

                                    {/* STATUS */}
                                    {status && (
                                        <StatusIndicator type={status.type === "success" ? "success" : "error"}>
                                            {status.message}
                                        </StatusIndicator>
                                    )}

                                    {/* ACTIONS */}
                                    <Box float="right">
                                        <Button variant="primary" loading={saving} onClick={handleSave}>
                                            Save changes
                                        </Button>
                                    </Box>

                                    {/* CHECKOUT MODAL */}
                                    <Modal
                                        visible={checkoutOpen}
                                        onDismiss={closeCheckoutAndRevert}
                                        header={checkoutDone ? "Purchase complete" : "Upgrade to Premium"}
                                        footer={
                                            <Box float="right">
                                                <SpaceBetween direction="horizontal" size="xs">
                                                    {checkoutDone ? (
                                                        <Button
                                                            variant="primary"
                                                            onClick={() => {
                                                                setCheckoutOpen(false);
                                                                resetCheckout();
                                                            }}
                                                        >
                                                            Done
                                                        </Button>
                                                    ) : (
                                                        <>
                                                            <Button variant="link" onClick={closeCheckoutAndRevert}>
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                variant="primary"
                                                                loading={checkoutSubmitting}
                                                                onClick={submitPayment}
                                                            >
                                                                Purchase
                                                            </Button>
                                                        </>
                                                    )}
                                                </SpaceBetween>
                                            </Box>
                                        }
                                    >

                                        {checkoutDone ? (
                                            <SpaceBetween size="m">
                                                <Box fontSize="heading-m" fontWeight="bold">
                                                    Purchased!
                                                </Box>
                                                <Box color="text-body-secondary">
                                                    Premium is now selected. Click <b>Save changes</b> to apply it to your account.
                                                </Box>
                                            </SpaceBetween>
                                        ) : (
                                            <Form>
                                                <SpaceBetween size="m">
                                                    <Box color="text-body-secondary">
                                                        Fill out payment form.
                                                    </Box>

                                                    {checkoutStatus && (
                                                        <StatusIndicator type={checkoutStatus.type === "success" ? "success" : "error"}>
                                                            {checkoutStatus.message}
                                                        </StatusIndicator>
                                                    )}
                                                    <FormField label="Name on card">
                                                        <Input
                                                            value={payment.cardName}
                                                            onChange={(e) =>
                                                                setPayment((p) => ({ ...p, cardName: e.detail.value }))
                                                            }
                                                            placeholder="e.g., John Doe"
                                                        />
                                                    </FormField>

                                                    <FormField label="Card number">
                                                        <Input
                                                            value={payment.cardNumber}
                                                            onChange={(e) =>
                                                                setPayment((p) => ({ ...p, cardNumber: e.detail.value }))
                                                            }
                                                            placeholder="4242 4242 4242 4242"
                                                        />
                                                    </FormField>

                                                    <SpaceBetween direction="horizontal" size="m">
                                                        <FormField label="Exp (MM/YY)">
                                                            <Input
                                                                value={payment.exp}
                                                                onChange={(e) =>
                                                                    setPayment((p) => ({ ...p, exp: e.detail.value }))
                                                                }
                                                                placeholder="12/27"
                                                            />
                                                        </FormField>

                                                        <FormField label="CVC">
                                                            <Input
                                                                value={payment.cvc}
                                                                onChange={(e) =>
                                                                    setPayment((p) => ({ ...p, cvc: e.detail.value }))
                                                                }
                                                                placeholder="123"
                                                            />
                                                        </FormField>

                                                        <FormField label="ZIP">
                                                            <Input
                                                                value={payment.zip}
                                                                onChange={(e) =>
                                                                    setPayment((p) => ({ ...p, zip: e.detail.value }))
                                                                }
                                                                placeholder="01102"
                                                            />
                                                        </FormField>
                                                    </SpaceBetween>

                                                    <Box color="text-body-secondary">
                                                        Total today: <b>$9.99</b> (demo)
                                                    </Box>
                                                </SpaceBetween>
                                            </Form>
                                        )}
                                    </Modal>
                                    
                                    {/* MFA MODAL */}
                                    <Modal
                                        visible={mfaModalOpen}
                                        onDismiss={() => {
                                            setMfaModalOpen(false);
                                            setMfaSetup(null);
                                            setMfaCode("");
                                            setMfaStatus(null);
                                        }}
                                        header="Enable MFA"
                                        footer={
                                            <Box float="right">
                                                <SpaceBetween direction="horizontal" size="xs">
                                                    <Button
                                                        variant="link"
                                                        onClick={() => {
                                                            setMfaModalOpen(false);
                                                            setMfaSetup(null);
                                                            setMfaCode("");
                                                            setMfaStatus(null);
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>

                                                    <Button
                                                        variant="primary"
                                                        onClick={verifyMfaSetup}
                                                        loading={mfaLoading}
                                                        disabled={!mfaSetup}
                                                    >
                                                        Verify &amp; Enable
                                                    </Button>
                                                </SpaceBetween>
                                            </Box>
                                        }
                                    >
                                        <div className="mfa-modal">
                                            <SpaceBetween size="m">
                                                {mfaStatus && (
                                                    <div className="mfa-status">
                                                        <StatusIndicator type={mfaStatus.type === "success" ? "success" : "error"}>
                                                            {mfaStatus.message}
                                                        </StatusIndicator>
                                                    </div>
                                                )}

                                                {!mfaSetup ? (
                                                    <div className="mfa-empty">
                                                        <Box color="text-body-secondary">
                                                            {mfaLoading
                                                                ? "Preparing MFA setup..."
                                                                : "Click Enable MFA to generate a QR code."}
                                                        </Box>

                                                        <div className="mfa-loader-hint" />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="mfa-section">
                                                            <Box fontWeight="bold" fontSize="heading-s">
                                                                Step 1: Scan the QR code
                                                            </Box>
                                                            <Box color="text-body-secondary">
                                                                Use Google Authenticator, Microsoft Authenticator, Authy, etc.
                                                            </Box>

                                                            <div className="mfa-qr-wrap">
                                                                <img
                                                                    className="mfa-qr"
                                                                    src={mfaSetup.qr}
                                                                    alt="MFA QR Code"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="mfa-section mfa-secret-section">
                                                            <Box color="text-body-secondary">
                                                                If you can’t scan, enter this secret manually:
                                                            </Box>

                                                            <div className="mfa-secret-row">
                                                                <div className="mfa-secret" title={mfaSetup.secret}>
                                                                    {mfaSetup.secret}
                                                                </div>

                                                                <Button
                                                                    variant="inline-link"
                                                                    onClick={async () => {
                                                                        try {
                                                                            await navigator.clipboard.writeText(String(mfaSetup.secret || ""));
                                                                            setMfaStatus({ type: "success", message: "Secret copied to clipboard." });
                                                                        } catch (err) {
                                                                            setMfaStatus({ type: "error", message: "Could not copy secret." });
                                                                        }
                                                                    }}
                                                                >
                                                                    Copy
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        <div className="mfa-section">
                                                            <Box fontWeight="bold" fontSize="heading-s">
                                                                Step 2: Enter the 6-digit code
                                                            </Box>

                                                            <FormField label="Authenticator code">
                                                                <Input
                                                                    value={mfaCode}
                                                                    placeholder="123456"
                                                                    inputMode="numeric"
                                                                    onChange={({ detail }) => {
                                                                        const next = String(detail.value || "").replace(/\D/g, "").slice(0, 6);
                                                                        setMfaCode(next);
                                                                    }}
                                                                />
                                                                <Box color="text-body-secondary" className="mfa-helper">
                                                                    Tip: the code changes every ~30 seconds.
                                                                </Box>
                                                            </FormField>
                                                        </div>
                                                    </>
                                                )}
                                            </SpaceBetween>
                                        </div>
                                    </Modal>
                                </SpaceBetween>
                            </ContentLayout>
                        </div>
                    }
                />
            </div>
        </>
    );
}
