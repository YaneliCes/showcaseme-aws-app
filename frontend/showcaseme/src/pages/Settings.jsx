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
                                </SpaceBetween>
                            </ContentLayout>
                        </div>
                    }
                />
            </div>
        </>
    );
}
