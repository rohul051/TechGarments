"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { DashboardWorkspace } from "@/components/dashboard/workspace";
import {
  deleteUserAccount,
  ensureFirebaseAccountSession,
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
  clearFactoryIndexedDbData,
  getFactoryNotificationsStorageKey,
  getWorkspaceThemeStorageKey,
  loadSavedWorkspaceTheme,
  persistWorkspaceTheme,
} from "@/lib/buyerSettings";
import { auth, db } from "@/lib/firebase";
import type { BuyerTheme, FactoryProfileDetails, User } from "@/types/user";

export default function FactoryDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [factoryProfile, setFactoryProfile] = useState<FactoryProfileDetails | null>(null);
  const [factoryTheme, setFactoryTheme] = useState<BuyerTheme>("default");

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};

    async function initializeDashboard() {
      const storedUser = getUser();
      const currentUser =
        !storedUser || storedUser.role !== "FACTORY"
          ? (await restoreUserFromFirebase()) ?? storedUser
          : storedUser;
      if (!active) return;
      if (!currentUser || currentUser.role !== "FACTORY") {
        router.replace("/login");
        return;
      }

      const account = findAccount(currentUser.email);
      const savedTheme = normalizeBuyerTheme(
        account?.theme || currentUser.theme || loadSavedWorkspaceTheme("factory", currentUser.email),
      );
      const localProfile: FactoryProfileDetails = {
        fullName: account?.role === "FACTORY" ? account.fullName : currentUser.fullName,
        email: currentUser.email,
        phone: account?.role === "FACTORY" ? account.phone || "" : "",
        companyName: account?.role === "FACTORY" ? account.companyName || "" : "",
        country: account?.role === "FACTORY" ? account.country || "" : "",
        city: account?.role === "FACTORY" ? account.city || "" : "",
        website: account?.role === "FACTORY" ? account.website || "" : "",
        photoURL:
          (account?.role === "FACTORY" ? account.photoURL : undefined) ||
          currentUser.photoURL ||
          "",
        coverPhotoURL: account?.role === "FACTORY" ? account.coverPhotoURL || "" : "",
        theme: savedTheme,
        monthlyCapacity: account?.role === "FACTORY" ? account.monthlyCapacity || 0 : 0,
        moq: account?.role === "FACTORY" ? account.moq || 0 : 0,
        processes: account?.role === "FACTORY" ? account.processes || [] : [],
        products: account?.role === "FACTORY" ? account.products || [] : [],
        workerCount: account?.role === "FACTORY" ? account.workerCount : undefined,
        productionLines: account?.role === "FACTORY" ? account.productionLines : undefined,
        machineInformation: account?.role === "FACTORY" ? account.machineInformation : undefined,
      };

      queueMicrotask(() => {
        if (active) {
          setUser(currentUser);
          setFactoryProfile(localProfile);
          setFactoryTheme(savedTheme);
        }
      });

      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!firebaseUser || firebaseUser.email?.toLowerCase() !== currentUser.email.toLowerCase()) return;
        try {
          const [profileSnapshot, userSnapshot] = await Promise.all([
            getDoc(doc(db, "factories", firebaseUser.uid)),
            getDoc(doc(db, "users", firebaseUser.uid)),
          ]);
          if (!active) return;

          const cloudUser = userSnapshot.exists() ? userSnapshot.data() : {};
          if (cloudUser.isActive === false) {
            logout();
            router.replace("/login?deleted=true");
            return;
          }

          if (profileSnapshot.exists() || userSnapshot.exists()) {
            const cloudProfile = profileSnapshot.exists() ? profileSnapshot.data() : {};
            const mergedTheme =
              typeof cloudProfile.theme === "string"
                ? normalizeBuyerTheme(cloudProfile.theme)
                : savedTheme;

            const mergedProfile: FactoryProfileDetails = {
              ...localProfile,
              fullName:
                (typeof cloudProfile.fullName === "string" && cloudProfile.fullName) ||
                (typeof cloudUser.fullName === "string" && cloudUser.fullName) ||
                localProfile.fullName,
              phone:
                typeof cloudProfile.phone === "string"
                  ? cloudProfile.phone
                  : typeof cloudUser.phoneNumber === "string"
                    ? cloudUser.phoneNumber
                    : localProfile.phone,
              companyName:
                typeof cloudProfile.companyName === "string" && cloudProfile.companyName
                  ? cloudProfile.companyName
                  : localProfile.companyName,
              country:
                typeof cloudProfile.country === "string"
                  ? cloudProfile.country
                  : localProfile.country,
              city:
                typeof cloudProfile.city === "string"
                  ? cloudProfile.city
                  : localProfile.city,
              website:
                typeof cloudProfile.website === "string"
                  ? cloudProfile.website
                  : localProfile.website,
              photoURL:
                typeof cloudProfile.photoURL === "string"
                  ? cloudProfile.photoURL
                  : typeof cloudUser.photoURL === "string"
                    ? cloudUser.photoURL
                    : localProfile.photoURL,
              coverPhotoURL:
                typeof cloudProfile.coverPhotoURL === "string"
                  ? cloudProfile.coverPhotoURL
                  : localProfile.coverPhotoURL,
              theme: mergedTheme,
              monthlyCapacity: Number(cloudProfile.monthlyCapacity) || localProfile.monthlyCapacity,
              moq: Number(cloudProfile.moq) || localProfile.moq,
              processes:
                Array.isArray(cloudProfile.processes) && cloudProfile.processes.length
                  ? cloudProfile.processes
                  : localProfile.processes,
              products:
                Array.isArray(cloudProfile.products) && cloudProfile.products.length
                  ? cloudProfile.products
                  : localProfile.products,
              workerCount:
                typeof cloudProfile.workerCount === "number"
                  ? cloudProfile.workerCount
                  : localProfile.workerCount,
              productionLines:
                typeof cloudProfile.productionLines === "number"
                  ? cloudProfile.productionLines
                  : localProfile.productionLines,
              machineInformation:
                typeof cloudProfile.machineInformation === "string"
                  ? cloudProfile.machineInformation
                  : localProfile.machineInformation,
            };

            setFactoryProfile(mergedProfile);
            if (account?.role === "FACTORY") {
              saveRegisteredAccount({ ...account, ...mergedProfile });
            }
            if (
              typeof cloudProfile.theme === "string" &&
              !localStorage.getItem(getWorkspaceThemeStorageKey("factory", currentUser.email))
            ) {
              setFactoryTheme(mergedTheme);
              persistWorkspaceTheme("factory", mergedTheme, currentUser.email);
            }
          }
        } catch (error) {
          console.error("[Factory profile] Failed to load Firestore profile:", error);
        }
      });
    }

    void initializeDashboard().catch((error: unknown) => {
      console.error("[Factory dashboard] Failed to restore the user session:", error);
      if (active) router.replace("/login");
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [router]);

  if (!user || !factoryProfile) return null;
  const activeUser = user;
  const activeProfile = factoryProfile;

  async function saveFactoryProfile(profile: FactoryProfileDetails): Promise<string> {
    const account = findAccount(activeUser.email);
    const firebaseUser = await ensureFirebaseAccountSession(activeUser.email);
    const matchingFirebaseUser =
      firebaseUser?.email?.toLowerCase() === activeUser.email.toLowerCase()
        ? firebaseUser
        : null;

    const updatedProfile: FactoryProfileDetails = {
      ...profile,
      theme: factoryTheme,
    };

    if (account?.role === "FACTORY") {
      saveRegisteredAccount({ ...account, ...updatedProfile });
    } else if (!matchingFirebaseUser) {
      throw new Error("Your factory account could not be found. Sign in again and retry.");
    }

    setFactoryProfile(updatedProfile);
    const updatedUser: User = {
      ...activeUser,
      fullName: profile.fullName,
      photoURL: profile.photoURL ?? "",
      theme: factoryTheme,
    };
    saveCurrentUser(updatedUser);
    setUser(updatedUser);

    if (matchingFirebaseUser) {
      await updateBuyerAuthDisplayName(profile.fullName);
      const {
        workerCount,
        productionLines,
        machineInformation,
        coverPhotoURL,
        photoURL,
        ...profileDetails
      } = updatedProfile;
      const now = new Date().toISOString();
      try {
        await Promise.all([
          setDoc(
            doc(db, "factories", matchingFirebaseUser.uid),
            {
              ...profileDetails,
              photoURL: photoURL ?? "",
              coverPhotoURL: coverPhotoURL ?? "",
              theme: factoryTheme,
              ...(workerCount === undefined ? {} : { workerCount }),
              ...(productionLines === undefined ? {} : { productionLines }),
              ...(machineInformation === undefined ? {} : { machineInformation }),
              id: matchingFirebaseUser.uid,
              updatedAt: now,
            },
            { merge: true },
          ),
          setDoc(
            doc(db, "users", matchingFirebaseUser.uid),
            {
              fullName: profile.fullName,
              phoneNumber: profile.phone,
              photoURL: photoURL ?? "",
              updatedAt: now,
            },
            { merge: true },
          ),
        ]);
      } catch (error) {
        console.error("[Factory profile] Failed to sync profile to Firestore:", error);
        if (account?.role !== "FACTORY") {
          throw new Error("The profile could not be synced to Firebase. Please try again.");
        }
        return "Profile saved in this browser, but Firebase sync failed. Please try again later.";
      }
    }

    return matchingFirebaseUser
      ? "Factory settings saved and synced to Firebase."
      : "Factory settings saved in this browser account.";
  }

  async function changeFactoryTheme(nextTheme: BuyerTheme): Promise<void> {
    setFactoryTheme(nextTheme);
    persistWorkspaceTheme("factory", nextTheme, activeUser.email);

    const account = findAccount(activeUser.email);
    if (account?.role === "FACTORY") {
      saveRegisteredAccount({ ...account, theme: nextTheme });
    }
    const updatedUser: User = { ...activeUser, theme: nextTheme };
    saveCurrentUser(updatedUser);
    setUser(updatedUser);
    setFactoryProfile((current) => (current ? { ...current, theme: nextTheme } : current));

    const firebaseUser = await ensureFirebaseAccountSession(activeUser.email);
    if (firebaseUser?.email?.toLowerCase() === activeUser.email.toLowerCase()) {
      try {
        await setDoc(
          doc(db, "factories", firebaseUser.uid),
          { theme: nextTheme, updatedAt: new Date().toISOString() },
          { merge: true },
        );
      } catch (error) {
        console.warn("[Factory theme] Failed to sync theme to Firestore:", error);
      }
    }
  }

  async function resetFactoryAccount(): Promise<string> {
    await clearFactoryIndexedDbData(activeUser.id, activeUser.email);

    const cleanEmail = activeUser.email.toLowerCase();
    if (typeof window !== "undefined") {
      localStorage.removeItem(getFactoryNotificationsStorageKey(cleanEmail));
    }

    setFactoryTheme("default");
    persistWorkspaceTheme("factory", "default", cleanEmail);

    const resetProfile: FactoryProfileDetails = {
      fullName: activeProfile.fullName,
      email: cleanEmail,
      phone: "",
      companyName: "My Factory",
      country: activeProfile.country || "",
      city: "",
      website: "",
      photoURL: "",
      coverPhotoURL: "",
      theme: "default",
      monthlyCapacity: 0,
      moq: 0,
      processes: [],
      products: [],
      workerCount: undefined,
      productionLines: undefined,
      machineInformation: undefined,
    };

    const account = findAccount(cleanEmail);
    if (account?.role === "FACTORY") {
      saveRegisteredAccount({
        ...account,
        ...resetProfile,
      });
    }

    const updatedUser: User = {
      ...activeUser,
      photoURL: "",
      theme: "default",
    };
    saveCurrentUser(updatedUser);
    setUser(updatedUser);
    setFactoryProfile(resetProfile);

    const firebaseUser = await ensureFirebaseAccountSession(activeUser.email);
    if (firebaseUser?.email?.toLowerCase() === cleanEmail) {
      const now = new Date().toISOString();
      try {
        await Promise.all([
          setDoc(
            doc(db, "factories", firebaseUser.uid),
            {
              id: firebaseUser.uid,
              fullName: resetProfile.fullName,
              email: cleanEmail,
              phone: "",
              companyName: "My Factory",
              country: resetProfile.country,
              city: "",
              website: "",
              photoURL: "",
              coverPhotoURL: "",
              theme: "default",
              monthlyCapacity: 0,
              moq: 0,
              processes: [],
              products: [],
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
        console.warn("[Factory reset] Failed to sync reset profile to Firestore:", error);
      }
    }

    return "Your factory workspace, theme, and profile details have been reset to defaults.";
  }

  async function deleteFactoryAccount(password: string): Promise<void> {
    await deleteUserAccount(activeUser.email, password);
    await clearFactoryIndexedDbData(activeUser.id, activeUser.email);
    router.replace("/login?deleted=true");
  }

  return (
    <DashboardWorkspace
      role="factory"
      fullName={activeUser.fullName}
      userId={activeUser.id}
      userEmail={activeUser.email}
      factoryProfile={activeProfile}
      onSaveFactoryProfile={saveFactoryProfile}
      factoryTheme={factoryTheme}
      onChangeFactoryTheme={changeFactoryTheme}
      onResetFactoryAccount={resetFactoryAccount}
      onDeleteFactoryAccount={deleteFactoryAccount}
      onLogout={() => {
        logout();
        router.push("/login");
      }}
    />
  );
}
