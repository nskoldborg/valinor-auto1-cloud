import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AccessProvider } from "./context/AccessContext";
import { UIProvider, useUI } from "./context/UIContext";
import { CountryProvider } from "./context/CountryContext";

// Core components
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";

// Home & Main Pages
import Home from "./pages/home/Home";
import GetNextTask from "./pages/home/GetNextTask";

// Analytics
import QueriesPublished from "./pages/analytics/QueriesPublished";
import AnalyticsDatasources from "./pages/analytics/datamarts/AnalyticsDatasources";
import DatasourceCreate from "./pages/analytics/datamarts/DatasourceCreate";
import DatasourceEdit from "./pages/analytics/datamarts/DatasourceEdit";
import QueriesCreate from "./pages/analytics/queries/QueriesCreate";
import QueriesView from "./pages/analytics/queries/QueriesView";

// Admin Pages
import Users from "./pages/admin/users/Users";
import UsersCreate from "./pages/admin/users/UsersCreate";
import UsersEdit from "./pages/admin/users/UsersEdit";
import UsersView from "./pages/admin/users/UsersView";
import Groups from "./pages/admin/groups/Groups";
import GroupsCreate from "./pages/admin/groups/GroupsCreate";
import GroupsEdit from "./pages/admin/groups/GroupsEdit";
import Roles from "./pages/admin/roles/Roles";
import RolesCreate from "./pages/admin/roles/RolesCreate";
import RolesEdit from "./pages/admin/roles/RolesEdit";
import Positions from "./pages/admin/positions/Positions";
import PositionsCreate from "./pages/admin/positions/PositionsCreate";
import PositionsEdit from "./pages/admin/positions/PositionsEdit";
import Countries from "./pages/admin/countries/Countries";
import CountriesCreate from "./pages/admin/countries/CountriesCreate";
import CountriesEdit from "./pages/admin/countries/CountriesEdit";
import MatrixLog from "./pages/admin/matrix/MatrixLog";

// Product Pages
import FeatureRequests from "./pages/product/feature_requests/FeatureRequests";
import FeatureRequestsEdit from "./pages/product/feature_requests/FeatureRequestsEdit";
import PositionRequests from "./pages/product/position_requests/PositionRequests";
import PositionRequestsEdit from "./pages/product/position_requests/PositionRequestsEdit";
import Workflows from "./pages/product/workflows/Workflows";
import WorkflowsCreate from "./pages/product/workflows/WorkflowsCreate";

// Tools / Other
import BatchUploader from "./pages/other/BatchUploader";
import BatchUploaderHistory from "./pages/other/BatchUploaderHistory";

// Settings
import About from "./pages/About";

// Inner App component that uses UI context
function AppContent() {
  const { uiSettings } = useUI();

  return (
    <div
      className="flex flex-col h-screen"
      style={{ backgroundColor: uiSettings.backgroundColor }}
    >
      <Header />
      <Routes>
        {/* ------------------------ */}
        {/* Public Routes */}
        {/* ------------------------ */}
        <Route path="/login" element={<Login />} />

        {/* ------------------------ */}
        {/* Home / Dashboard */}
        {/* ------------------------ */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/home/get-next-task"
          element={
            <ProtectedRoute>
              <GetNextTask />
            </ProtectedRoute>
          }
        />

        {/* ------------------------ */}
        {/* Analytics */}
        {/* ------------------------ */}
        <Route
          path="/analytics/queries/published"
          element={
            <ProtectedRoute>
              <QueriesPublished />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics/datasources"
          element={
            <ProtectedRoute>
              <AnalyticsDatasources />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics/datasources/create"
          element={
            <ProtectedRoute>
              <DatasourceCreate />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics/datasources/:id/edit"
          element={
            <ProtectedRoute>
              <DatasourceEdit />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics/queries/new"
          element={
            <ProtectedRoute>
              <QueriesCreate />
            </ProtectedRoute>
          }
        />


        <Route
          path="/analytics/queries/:id"
          element={
            <ProtectedRoute>
              <QueriesView />
            </ProtectedRoute>
          }
        />

        {/* ------------------------ */}
        {/* Admin: Users / Groups / Roles */}
        {/* ------------------------ */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users/create"
          element={
            <ProtectedRoute>
              <UsersCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users/:id/edit"
          element={
            <ProtectedRoute>
              <UsersEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users/:id/view"
          element={
            <ProtectedRoute>
              <UsersView />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/user-groups"
          element={
            <ProtectedRoute>
              <Groups />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/user-groups/create"
          element={
            <ProtectedRoute>
              <GroupsCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/user-groups/:id/edit"
          element={
            <ProtectedRoute>
              <GroupsEdit />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/user-roles"
          element={
            <ProtectedRoute>
              <Roles />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/user-roles/create"
          element={
            <ProtectedRoute>
              <RolesCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/user-roles/:id/edit"
          element={
            <ProtectedRoute>
              <RolesEdit />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/user-positions"
          element={
            <ProtectedRoute>
              <Positions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/user-positions/create"
          element={
            <ProtectedRoute>
              <PositionsCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/user-positions/:id/edit"
          element={
            <ProtectedRoute>
              <PositionsEdit />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/countries"
          element={
            <ProtectedRoute>
              <Countries />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/countries/create"
          element={
            <ProtectedRoute>
              <CountriesCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/countries/:id/edit"
          element={
            <ProtectedRoute>
              <CountriesEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/matrix-log"
          element={
            <ProtectedRoute>
              <MatrixLog />
            </ProtectedRoute>
          }
        />

        {/* ------------------------ */}
        {/* Product: Feature Requests */}
        {/* ------------------------ */}
        <Route
          path="/product/feature-requests"
          element={
            <ProtectedRoute>
              <FeatureRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/product/feature-requests/:feature_id"
          element={
            <ProtectedRoute>
              <FeatureRequestsEdit />
            </ProtectedRoute>
          }
        />

        {/* ------------------------ */}
        {/* Product: Position Requests */}
        {/* ------------------------ */}
        <Route
          path="/product/position-requests"
          element={
            <ProtectedRoute>
              <PositionRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/product/position-requests/:request_id"
          element={
            <ProtectedRoute>
              <PositionRequestsEdit />
            </ProtectedRoute>
          }
        />

        {/* ------------------------ */}
        {/* Product: Workflows */}
        {/* ------------------------ */}
        <Route
          path="/product/workflows"
          element={
            <ProtectedRoute>
              <Workflows />
            </ProtectedRoute>
          }
        />
        <Route
          path="/product/workflows/create"
          element={
            <ProtectedRoute>
              <WorkflowsCreate />
            </ProtectedRoute>
          }
        />

        {/* ------------------------ */}
        {/* Tools / Batch Uploader */}
        {/* ------------------------ */}
        <Route
          path="/other/batch-uploader"
          element={
            <ProtectedRoute>
              <BatchUploader />
            </ProtectedRoute>
          }
        />
        <Route
          path="/other/batch-uploader/history"
          element={
            <ProtectedRoute>
              <BatchUploaderHistory />
            </ProtectedRoute>
          }
        />

        {/* ------------------------ */}
        {/* About */}
        {/* ------------------------ */}
        <Route
          path="/about"
          element={
            <ProtectedRoute>
              <About />
            </ProtectedRoute>
          }
        />

        {/* ------------------------ */}
        {/* Fallback */}
        {/* ------------------------ */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </div>
  );
}

// Main App component with all providers
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AccessProvider>
          <UIProvider>
            <CountryProvider>
              <AppContent />
            </CountryProvider>
          </UIProvider>
        </AccessProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;