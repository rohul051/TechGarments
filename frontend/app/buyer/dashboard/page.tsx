"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { DashboardWorkspace } from "@/components/dashboard/workspace";
import {
  deleteUserAccount,
  findAccount,
  getUser,
  logout,
  normalizeBuyerTheme,
  restoreUserFromFirebase,
  saveCurrentUser,
  saveRegisteredAccount,
  updateBuyerAuthDisplayName,
} from "@/lib/auth";
import {
  clearBuyerIndexedDbData,
  getBuyerNotificationsStorageKey,
  getBuyerSavedStorageKey,
  loadSavedBuyerTheme,
  persistBuyerTheme,
} from "@/lib/buyerSettings";
import { auth, db } from "@/lib/firebase";
import type { BuyerProfileDetails, BuyerTheme, User } from "@/types/user";

export default function BuyerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [buyerProfile, setBuyerProfile] = useState<BuyerProfileDetails | null>(null);
  const [buyerTheme, setBuyerTheme] = useState<BuyerTheme>("default");

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};

    async function initializeDashboard() {
      const storedUser = getUser();
      const currentUser =
        !storedUser || storedUser.role !== "BUYER"
          ? (await restoreUserFromFirebase()) ?? storedUser
          : storedUser;
      if (!active) return;
      if (!currentUser || currentUser.role !== "BUYER") {
        router.replace("/login");
        return;
      }

      const account = findAccount(currentUser.email);
      const savedTheme = normalizeBuyerTheme(
        account?.theme || currentUser.theme || loadSavedBuyerTheme(currentUser.email),
      );
      const localProfile: BuyerProfileDetails = {
        fullName: account?.role === "BUYER" ? account.fullName : currentUser.fullName,
        email: currentUser.email,
        phone: account?.role === "BUYER" ? account.phone || "" : "",
        companyName: account?.role === "BUYER" ? account.companyName || "My Brand" : "My Brand",
        buyerType: account?.role === "BUYER" ? account.buyerType || "Clothing Brand" : "Clothing Brand",
        country: account?.role === "BUYER" ? account.country || "" : "",
        website: account?.role === "BUYER" ? account.website || "" : "",
        photoURL:
          (account?.role === "BUYER" ? account.photoURL : undefined) ||
          currentUser.photoURL ||
          "",
        theme: savedTheme,
      };

      queueMicrotask(() => {
        if (active) {
          setUser(currentUser);
          setBuyerProfile(localProfile);
          setBuyerTheme(savedTheme);
        }
      });

      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!firebaseUser || firebaseUser.email?.toLowerCase() !== currentUser.email.toLowerCase()) return;
        try {
          const [buyerSnapshot, userSnapshot] = await Promise.all([
            getDoc(doc(db, "buyers", firebaseUser.uid)),
            getDoc(doc(db, "users", firebaseUser.uid)),
          ]);
          if (!active) return;

          const cloudBuyer = buyerSnapshot.exists() ? buyerSnapshot.data() : {};
          const cloudUser = userSnapshot.exists() ? userSnapshot.data() : {};
          if (cloudUser.isActive === false) {
            logout();
            router.replace("/login?deleted=true");
            return;
          }

          if (buyerSnapshot.exists() || userSnapshot.exists()) {
            const mergedTheme =
              typeof cloudBuyer.theme === "string"
                ? normalizeBuyerTheme(cloudBuyer.theme)
                : savedTheme;

            setBuyerProfile((current) => {
              const base = current ?? localProfile;
              return {
                ...base,
                fullName:
                  (typeof cloudBuyer.fullName === "string" && cloudBuyer.fullName) ||
                  (typeof cloudUser.fullName === "string" && cloudUser.fullName) ||
                  base.fullName,
                phone:
                  typeof cloudBuyer.phone === "string"
                    ? cloudBuyer.phone
                    : typeof cloudUser.phoneNumber === "string"
                      ? cloudUser.phoneNumber
                      : base.phone,
                companyName:
                  typeof cloudBuyer.companyName === "string" && cloudBuyer.companyName
                    ? cloudBuyer.companyName
                    : base.companyName,
                buyerType:
                  typeof cloudBuyer.buyerType === "string" && cloudBuyer.buyerType
                    ? cloudBuyer.buyerType
                    : base.buyerType,
                country:
                  typeof cloudBuyer.country === "string"
                    ? cloudBuyer.country
                    : base.country,
                website:
                  typeof cloudBuyer.website === "string"
                    ? cloudBuyer.website
                    : base.website,
                photoURL:
                  typeof cloudBuyer.photoURL === "string"
                    ? cloudBuyer.photoURL
                    : typeof cloudUser.photoURL === "string"
                      ? cloudUser.photoURL
                      : base.photoURL,
                theme: mergedTheme,
              };
            });

            if (typeof cloudBuyer.theme === "string" && !localStorage.getItem(`techgarments_buyer_theme_${currentUser.email.toLowerCase()}`)) {
              setBuyerTheme(mergedTheme);
              persistBuyerTheme(mergedTheme, currentUser.email);
            }
          }
        } catch (error) {
          console.error("[Buyer profile] Failed to load Firestore profile:", error);
        }
      });
    }

    void initializeDashboard().catch((error: unknown) => {
      console.error("[Buyer dashboard] Failed to restore the user session:", error);
      if (active) router.replace("/login");
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [router]);

  if (!user || !buyerProfile) return null;
  const activeUser = user;
  const activeProfile = buyerProfile;

  async function saveBuyerProfile(profile: BuyerProfileDetails): Promise<string> {
    const account = findAccount(activeUser.email);
    const firebaseUser = auth.currentUser;
    const matchingFirebaseUser =
      firebaseUser?.email?.toLowerCase() === activeUser.email.toLowerCase()
        ? firebaseUser
        : null;

    if (account?.role === "BUYER") {
      saveRegisteredAccount({
        ...account,
        fullName: profile.fullName,
        phone: profile.phone,
        companyName: profile.companyName,
        buyerType: profile.buyerType,
        country: profile.country,
        website: profile.website,
        photoURL: profile.photoURL ?? "",
        theme: buyerTheme,
      });
    } else if (!matchingFirebaseUser) {
      throw new Error("Your buyer account could not be found. Sign in again and retry.");
    }

    const updatedProfile: BuyerProfileDetails = {
      ...profile,
      theme: buyerTheme,
    };
    setBuyerProfile(updatedProfile);

    const updatedUser: User = {
      ...activeUser,
      fullName: profile.fullName,
      photoURL: profile.photoURL ?? "",
      theme: buyerTheme,
    };
    saveCurrentUser(updatedUser);
    setUser(updatedUser);

    if (matchingFirebaseUser) {
      await updateBuyerAuthDisplayName(profile.fullName);
      const now = new Date().toISOString();
      try {
        await Promise.all([
          setDoc(
            doc(db, "buyers", matchingFirebaseUser.uid),
            {
              id: matchingFirebaseUser.uid,
              fullName: profile.fullName,
              email: activeUser.email.toLowerCase(),
              phone: profile.phone,
              companyName: profile.companyName,
              buyerType: profile.buyerType,
              country: profile.country || "",
              website: profile.website,
              photoURL: profile.photoURL ?? "",
              theme: buyerTheme,
              updatedAt: now,
            },
            { merge: true },
          ),
          setDoc(
            doc(db, "users", matchingFirebaseUser.uid),
            {
              fullName: profile.fullName,
              phoneNumber: profile.phone,
              photoURL: profile.photoURL ?? "",
              updatedAt: now,
            },
            { merge: true },
          ),
        ]);
      } catch (error) {
        console.error("[Buyer profile] Failed to sync profile to Firestore:", error);
        if (account?.role !== "BUYER") {
          throw new Error("The profile could not be synced to Firebase. Please try again.");
        }
        return "Profile saved in this browser, but Firebase sync failed. Please try again later.";
      }
    }

    return matchingFirebaseUser
      ? "Profile settings saved and synced to Firebase."
      : "Profile settings saved in this browser account.";
  }

  async function changeBuyerTheme(nextTheme: BuyerTheme): Promise<void> {
    setBuyerTheme(nextTheme);
    persistBuyerTheme(nextTheme, activeUser.email);

    const account = findAccount(activeUser.email);
    if (account?.role === "BUYER") {
      saveRegisteredAccount({ ...account, theme: nextTheme });
    }
    const updatedUser: User = { ...activeUser, theme: nextTheme };
    saveCurrentUser(updatedUser);
    setUser(updatedUser);
    setBuyerProfile((current) => (current ? { ...current, theme: nextTheme } : current));

    const firebaseUser = auth.currentUser;
    if (firebaseUser?.email?.toLowerCase() === activeUser.email.toLowerCase()) {
      try {
        await setDoc(
          doc(db, "buyers", firebaseUser.uid),
          { theme: nextTheme, updatedAt: new Date().toISOString() },
          { merge: true },
        );
      } catch (error) {
        console.warn("[Buyer theme] Failed to sync theme to Firestore:", error);
      }
    }
  }

  async function resetBuyerAccount(): Promise<string> {
    await clearBuyerIndexedDbData(activeUser.id, activeUser.email);

    const cleanEmail = activeUser.email.toLowerCase();
    if (typeof window !== "undefined") {
      localStorage.removeItem(getBuyerSavedStorageKey(cleanEmail));
      localStorage.removeItem(getBuyerNotificationsStorageKey(cleanEmail));
    }

    setBuyerTheme("default");
    persistBuyerTheme("default", cleanEmail);

    const resetProfile: BuyerProfileDetails = {
      fullName: activeProfile.fullName,
      email: cleanEmail,
      phone: "",
      companyName: "My Brand",
      buyerType: "Clothing Brand",
      country: activeProfile.country || "",
      website: "",
      photoURL: "",
      theme: "default",
    };

    const account = findAccount(cleanEmail);
    if (account?.role === "BUYER") {
      saveRegisteredAccount({
        ...account,
        phone: "",
        companyName: "My Brand",
        buyerType: "Clothing Brand",
        website: "",
        photoURL: "",
        theme: "default",
      });
    }

    const updatedUser: User = {
      ...activeUser,
      photoURL: "",
      theme: "default",
    };
    saveCurrentUser(updatedUser);
    setUser(updatedUser);
    setBuyerProfile(resetProfile);

    const firebaseUser = auth.currentUser;
    if (firebaseUser?.email?.toLowerCase() === cleanEmail) {
      const now = new Date().toISOString();
      try {
        await Promise.all([
          setDoc(
            doc(db, "buyers", firebaseUser.uid),
            {
              id: firebaseUser.uid,
              fullName: resetProfile.fullName,
              email: cleanEmail,
              phone: "",
              companyName: "My Brand",
              buyerType: "Clothing Brand",
              website: "",
              photoURL: "",
              theme: "default",
              updatedAt: now,
            },
            { merge: true },
          ),
          setDoc(
            doc(db, "users", firebaseUser.uid),
            {
              phoneNumber: "",
              photoURL: "",
              updatedAt: now,
            },
            { merge: true },
          ),
        ]);
      } catch (error) {
        console.warn("[Buyer reset] Failed to sync reset profile to Firestore:", error);
      }
    }

    return "Your buyer account workspace, theme, saved factories, and profile details have been reset to defaults.";
  }

  async function deleteBuyerAccount(password: string): Promise<void> {
    await deleteUserAccount(activeUser.email, password);
    await clearBuyerIndexedDbData(activeUser.id, activeUser.email);
    router.replace("/login?deleted=true");
  }

  return (
    <DashboardWorkspace
      role="buyer"
      fullName={activeUser.fullName}
      userId={activeUser.id}
      userEmail={activeUser.email}
      buyerProfile={activeProfile}
      onSaveBuyerProfile={saveBuyerProfile}
      buyerTheme={buyerTheme}
      onChangeBuyerTheme={changeBuyerTheme}
      onResetBuyerAccount={resetBuyerAccount}
      onDeleteBuyerAccount={deleteBuyerAccount}
      onLogout={() => {
        logout();
        router.push("/login");
      }}
    />
  );
}
