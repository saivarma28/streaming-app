import React, { useState, useEffect } from "react";
import { 
  FiUsers, FiCheck, FiX, FiSearch, FiStar, FiPlus, 
  FiEye, FiEdit2, FiTrash2, FiKey, FiShield, 
  FiFileText, FiChevronLeft, FiChevronRight, FiCopy 
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { 
  getAllUsers, 
  adminCreateUser, 
  adminUpdateUser, 
  adminResetPassword, 
  adminDeleteUser,
  getAdminAuditLogs
} from "../../services/apiService";

export default function AdminUsers() {
  const { currentUser } = useAuth();
  
  // Data list and loading states
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters, sorting, search, and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // "all", "normal", "premium"
  const [filterStatus, setFilterStatus] = useState("all"); // "all", "active", "disabled"
  const [sortBy, setSortBy] = useState("newest"); // "newest", "oldest", "name"
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCredentialsOpen, setIsCredentialsOpen] = useState(false);
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false);

  // Create User Form State
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createConfirmPassword, setCreateConfirmPassword] = useState("");
  const [createRole, setCreateRole] = useState("user");
  const [createAccountType, setCreateAccountType] = useState("normal"); // "normal", "premium"
  const [createStatus, setCreateStatus] = useState("active"); // "active", "disabled"
  const [createExpiryOption, setCreateExpiryOption] = useState("no-expiry"); // "no-expiry", "custom"
  const [createExpiryDate, setCreateExpiryDate] = useState("");
  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Credentials Summary State
  const [summaryCredentials, setSummaryCredentials] = useState(null);

  // Edit User State
  const [selectedUser, setSelectedUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("user");
  const [editAccountType, setEditAccountType] = useState("normal");
  const [editStatus, setEditStatus] = useState("active");
  const [editExpiryOption, setEditExpiryOption] = useState("no-expiry");
  const [editExpiryDate, setEditExpiryDate] = useState("");
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Reset Password State
  const [resetUser, setResetUser] = useState(null);
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccessCredentials, setResetSuccessCredentials] = useState(null);

  // Delete State
  const [deleteUserObj, setDeleteUserObj] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState("");

  // Fetch Users
  async function loadUsers() {
    if (!currentUser) return;
    setLoading(true);
    setError("");
    try {
      const token = await currentUser.getIdToken();
      const data = await getAllUsers(token);
      setUsers(data.users || []);
    } catch (err) {
      console.error("Failed to load users directory:", err.message);
      setError("Failed to fetch users list. Only administrators are authorized.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [currentUser]);

  // Fetch Audit Logs
  async function loadAuditLogs() {
    if (!currentUser) return;
    setLogsLoading(true);
    setLogsError("");
    try {
      const token = await currentUser.getIdToken();
      const data = await getAdminAuditLogs(token);
      setAuditLogs(data.logs || []);
    } catch (err) {
      console.error("Failed to load audit logs:", err.message);
      setLogsError("Failed to fetch audit logs.");
    } finally {
      setLogsLoading(false);
    }
  }

  // Strong password generator helper
  function handleGeneratePassword(target) {
    const length = 12;
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const special = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    const all = uppercase + lowercase + numbers + special;

    let generated = "";
    generated += uppercase[Math.floor(Math.random() * uppercase.length)];
    generated += lowercase[Math.floor(Math.random() * lowercase.length)];
    generated += numbers[Math.floor(Math.random() * numbers.length)];
    generated += special[Math.floor(Math.random() * special.length)];

    for (let i = 4; i < length; i++) {
      generated += all[Math.floor(Math.random() * all.length)];
    }

    // Shuffle characters
    const password = generated.split('').sort(() => 0.5 - Math.random()).join('');
    
    if (target === "create") {
      setCreatePassword(password);
      setCreateConfirmPassword(password);
    } else if (target === "reset") {
      setResetNewPassword(password);
    }
  }

  // Copy helper
  function handleCopyToClipboard(text, message) {
    navigator.clipboard.writeText(text);
    setSuccess(message);
    setTimeout(() => setSuccess(""), 3000);
  }

  // Handle Create User Submit
  async function handleCreateUserSubmit(e) {
    e.preventDefault();
    setCreateError("");

    if (!createName.trim()) return setCreateError("Full name is required.");
    if (!createEmail.trim()) return setCreateError("Email address is required.");
    if (createPassword.length < 6) return setCreateError("Password must be at least 6 characters.");
    if (createPassword !== createConfirmPassword) return setCreateError("Passwords do not match.");
    
    if (createExpiryOption === "custom") {
      if (!createExpiryDate) return setCreateError("Please select an expiry date.");
      if (new Date(createExpiryDate) < new Date().setHours(0,0,0,0)) {
        return setCreateError("Expiry date cannot be in the past.");
      }
    }

    setCreateLoading(true);
    try {
      const token = await currentUser.getIdToken();
      // "no-expiry" sets expiry to far future 2099-12-31 to be fully authorized on the backend HLS playbacks
      const expiryToSend = createExpiryOption === "no-expiry" 
        ? "2099-12-31T23:59:59.000Z" 
        : new Date(createExpiryDate).toISOString();

      const userData = {
        name: createName,
        email: createEmail.toLowerCase(),
        password: createPassword,
        role: createRole,
        isPremium: createAccountType === "premium",
        premiumExpiryDate: expiryToSend,
        isDisabled: createStatus === "disabled"
      };

      const res = await adminCreateUser(token, userData);
      if (res.success) {
        setSummaryCredentials({
          name: createName,
          email: createEmail.toLowerCase(),
          password: createPassword,
          accountType: createAccountType === "premium" ? "Premium" : "Normal",
          status: createStatus === "active" ? "Active" : "Disabled",
          expiry: createExpiryOption === "no-expiry" ? "No Expiry" : new Date(createExpiryDate).toLocaleDateString("en-IN")
        });
        
        // Reset form fields
        setCreateName("");
        setCreateEmail("");
        setCreatePassword("");
        setCreateConfirmPassword("");
        setCreateRole("user");
        setCreateAccountType("normal");
        setCreateStatus("active");
        setCreateExpiryOption("no-expiry");
        setCreateExpiryDate("");
        
        setIsCreateOpen(false);
        setIsCredentialsOpen(true);
        loadUsers();
      }
    } catch (err) {
      setCreateError(err.message || "Failed to create user.");
    } finally {
      setCreateLoading(false);
    }
  }

  // Handle Edit Click
  function handleEditClick(user) {
    setSelectedUser(user);
    setEditName(user.name || "");
    setEditRole(user.role || "user");
    setEditAccountType(user.isPremium ? "premium" : "normal");
    setEditStatus(user.isDisabled ? "disabled" : "active");
    
    const hasFarFutureExpiry = user.premiumExpiryDate && new Date(user.premiumExpiryDate).getFullYear() > 2090;
    if (user.premiumExpiryDate && !hasFarFutureExpiry) {
      setEditExpiryOption("custom");
      setEditExpiryDate(new Date(user.premiumExpiryDate).toISOString().substring(0, 10));
    } else {
      setEditExpiryOption("no-expiry");
      setEditExpiryDate("");
    }
    setEditError("");
    setIsEditOpen(true);
  }

  // Handle Update Submit
  async function handleUpdateUserSubmit(e) {
    e.preventDefault();
    setEditError("");

    if (!editName.trim()) return setEditError("Name is required.");
    if (editExpiryOption === "custom") {
      if (!editExpiryDate) return setEditError("Please select a valid expiry date.");
      if (new Date(editExpiryDate) < new Date().setHours(0,0,0,0)) {
        return setEditError("Expiry date cannot be in the past.");
      }
    }

    setEditLoading(true);
    try {
      const token = await currentUser.getIdToken();
      const expiryToSend = editExpiryOption === "no-expiry" 
        ? "2099-12-31T23:59:59.000Z" 
        : new Date(editExpiryDate).toISOString();

      const updateData = {
        name: editName,
        role: editRole,
        isPremium: editAccountType === "premium",
        premiumExpiryDate: expiryToSend,
        isDisabled: editStatus === "disabled"
      };

      const res = await adminUpdateUser(token, selectedUser.firebaseUid, updateData);
      if (res.success) {
        setIsEditOpen(false);
        setSuccess(`User profile for ${editName} updated successfully.`);
        setTimeout(() => setSuccess(""), 4000);
        loadUsers();
      }
    } catch (err) {
      setEditError(err.message || "Failed to update user.");
    } finally {
      setEditLoading(false);
    }
  }

  // Handle Reset Password Click
  function handleResetClick(user) {
    setResetUser(user);
    setResetNewPassword("");
    setResetError("");
    setResetSuccessCredentials(null);
    setIsResetOpen(true);
  }

  // Handle Reset Password Submit
  async function handleResetPasswordSubmit(e) {
    e.preventDefault();
    setResetError("");

    if (resetNewPassword.length < 6) {
      return setResetError("Password must be at least 6 characters.");
    }

    setResetLoading(true);
    try {
      const token = await currentUser.getIdToken();
      const res = await adminResetPassword(token, resetUser.firebaseUid, resetNewPassword);
      if (res.success) {
        setResetSuccessCredentials({
          name: resetUser.name,
          email: resetUser.email,
          password: resetNewPassword
        });
      }
    } catch (err) {
      setResetError(err.message || "Failed to reset password.");
    } finally {
      setResetLoading(false);
    }
  }

  // Handle Delete Click
  function handleDeleteClick(user) {
    setDeleteUserObj(user);
    setDeleteError("");
    setIsDeleteOpen(true);
  }

  // Handle Delete Confirm
  async function handleDeleteConfirm() {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const token = await currentUser.getIdToken();
      const res = await adminDeleteUser(token, deleteUserObj.firebaseUid);
      if (res.success) {
        setIsDeleteOpen(false);
        setSuccess(`Account deleted successfully.`);
        setTimeout(() => setSuccess(""), 4000);
        loadUsers();
      }
    } catch (err) {
      setDeleteError(err.message || "Failed to delete user account.");
    } finally {
      setDeleteLoading(false);
    }
  }

  // Open Audit Logs
  function handleOpenAuditLogs() {
    loadAuditLogs();
    setIsAuditLogsOpen(true);
  }

  // Filtering and Sorting Algorithm
  const processedUsers = users
    .filter(user => {
      // Search filter
      const matchesSearch = searchQuery.trim() === "" ||
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Account Type filter
      let matchesType = true;
      if (filterType === "premium") matchesType = user.isPremium === true;
      else if (filterType === "normal") matchesType = !user.isPremium;

      // Status filter
      let matchesStatus = true;
      if (filterStatus === "active") matchesStatus = !user.isDisabled;
      else if (filterStatus === "disabled") matchesStatus = user.isDisabled === true;

      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      // Sorting
      if (sortBy === "oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortBy === "name") {
        return (a.name || "").localeCompare(b.name || "");
      }
      // default: newest
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  // Pagination calculations
  const totalItems = processedUsers.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedUsers = processedUsers.slice(startIndex, endIndex);

  // Handle page navigation safely
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Adjust pagination window on filter modifications
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, filterStatus, sortBy, pageSize]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#e50914] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase text-white tracking-wide">User Management</h1>
          <p className="text-xs text-gray-400 font-light mt-1">
            Provision database profiles, secure Firebase credentials, update roles, and manage premium expiry dates.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleOpenAuditLogs}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-200 border border-white/5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg"
          >
            <FiFileText className="h-3.5 w-3.5 text-gray-400" />
            Audit Logs
          </button>
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#e50914] to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-[0_4px_15px_rgba(229,9,20,0.3)] hover:scale-[1.02]"
          >
            <FiPlus className="h-4 w-4" />
            Create User
          </button>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-2xl text-xs font-bold shadow-lg animate-fade-in flex items-center gap-2">
          <FiCheck className="h-4 w-4" />
          {success}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/25 text-red-400 rounded-2xl text-xs font-bold shadow-lg">
          {error}
        </div>
      )}

      {/* Control filters dashboard */}
      <div className="bg-[#12131a] border border-white/5 p-5 rounded-3xl flex flex-col md:flex-row gap-4 shadow-xl">
        {/* Search */}
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4.5 w-4.5" />
          <input
            type="text"
            placeholder="Search users by name or email address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/5 bg-white/3 text-xs text-white placeholder-gray-400 outline-none focus:border-red-500/30 focus:bg-white/5 transition-all font-semibold"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap gap-3">
          {/* Account Type */}
          <div className="flex flex-col gap-1 min-w-36">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3.5 py-3 rounded-xl border border-white/5 bg-white/3 text-xs text-gray-300 font-bold outline-none cursor-pointer focus:border-red-500/30"
            >
              <option value="all">All Types</option>
              <option value="normal">Normal Users</option>
              <option value="premium">Premium Users</option>
            </select>
          </div>

          {/* Account Status */}
          <div className="flex flex-col gap-1 min-w-36">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3.5 py-3 rounded-xl border border-white/5 bg-white/3 text-xs text-gray-300 font-bold outline-none cursor-pointer focus:border-red-500/30"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="disabled">Disabled Only</option>
            </select>
          </div>

          {/* Sorting */}
          <div className="flex flex-col gap-1 min-w-36">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3.5 py-3 rounded-xl border border-white/5 bg-white/3 text-xs text-gray-300 font-bold outline-none cursor-pointer focus:border-red-500/30"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Table View */}
      <div className="bg-[#12131a] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
        {paginatedUsers.length === 0 ? (
          <div className="p-20 text-center text-gray-500 font-light text-sm">
            No registered users found matching the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 bg-white/2 text-gray-400 uppercase text-[10px] tracking-wider font-extrabold">
                  <th className="py-4.5 px-6">Avatar & Name</th>
                  <th className="py-4.5 px-6">Email Address</th>
                  <th className="py-4.5 px-6 text-center">Auth Role</th>
                  <th className="py-4.5 px-6 text-center">Type</th>
                  <th className="py-4.5 px-6 text-center">Status</th>
                  <th className="py-4.5 px-6 text-center">Expiry Date</th>
                  <th className="py-4.5 px-6 text-center">Created Date</th>
                  <th className="py-4.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-semibold text-gray-300">
                {paginatedUsers.map((user) => {
                  const isPremiumActive = user.isPremium === true && 
                    (!user.premiumExpiryDate || new Date(user.premiumExpiryDate) > new Date());
                  const hasInfiniteExpiry = user.premiumExpiryDate && new Date(user.premiumExpiryDate).getFullYear() > 2090;

                  return (
                    <tr key={user.id} className="hover:bg-white/2 transition-colors">
                      {/* Avatar & Name */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`h-8.5 w-8.5 rounded-xl flex items-center justify-center font-bold uppercase border text-sm ${
                            user.role === "admin" 
                              ? "bg-red-500/10 text-[#e50914] border-red-500/15" 
                              : "bg-white/5 text-gray-300 border-white/5"
                          }`}>
                            {user.name ? user.name[0] : "U"}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-white font-extrabold text-sm">{user.name || "User Account"}</span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-4 px-6 font-mono text-gray-400 font-normal">{user.email}</td>

                      {/* Role */}
                      <td className="py-4 px-6 text-center">
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                          user.role === "admin" 
                            ? "bg-red-500/15 text-red-500 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]" 
                            : "bg-white/5 text-gray-400 border-white/5"
                        }`}>
                          {user.role}
                        </span>
                      </td>

                      {/* Premium Status */}
                      <td className="py-4 px-6 text-center">
                        {isPremiumActive ? (
                          <span className="inline-flex items-center gap-1.5 text-[9px] font-extrabold bg-amber-500/10 text-amber-500 px-2.5 py-0.5 rounded-md border border-amber-500/20 uppercase tracking-wide">
                            ⭐ Premium
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/5 text-gray-400 border border-white/5 uppercase tracking-wider">
                            Normal
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 text-center">
                        {user.isDisabled ? (
                          <span className="text-[9px] font-bold px-2.5 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/15 uppercase tracking-wider">
                            Disabled
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 uppercase tracking-wider">
                            Active
                          </span>
                        )}
                      </td>

                      {/* Expiry */}
                      <td className="py-4 px-6 text-center text-gray-400 font-normal">
                        {user.isPremium ? (
                          hasInfiniteExpiry ? "No Expiry" : (user.premiumExpiryDate ? new Date(user.premiumExpiryDate).toLocaleDateString("en-IN") : "N/A")
                        ) : (
                          "-"
                        )}
                      </td>

                      {/* Created */}
                      <td className="py-4 px-6 text-center text-gray-500 font-normal">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          {/* Reset password */}
                          <button
                            onClick={() => handleResetClick(user)}
                            title="Reset password"
                            className="p-1.5 bg-white/5 hover:bg-[#e50914]/10 border border-white/5 hover:border-red-500/20 text-gray-400 hover:text-red-500 rounded-lg transition-all cursor-pointer"
                          >
                            <FiKey className="h-3.5 w-3.5" />
                          </button>
                          {/* Edit user */}
                          <button
                            onClick={() => handleEditClick(user)}
                            title="Edit user parameters"
                            className="p-1.5 bg-white/5 hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/20 text-gray-400 hover:text-amber-500 rounded-lg transition-all cursor-pointer"
                          >
                            <FiEdit2 className="h-3.5 w-3.5" />
                          </button>
                          {/* Delete user */}
                          <button
                            onClick={() => handleDeleteClick(user)}
                            title="Delete user account"
                            className="p-1.5 bg-white/5 hover:bg-red-600/10 border border-white/5 hover:border-red-600/20 text-gray-400 hover:text-red-500 rounded-lg transition-all cursor-pointer"
                          >
                            <FiTrash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table footer metadata & paging controls */}
        {totalPages > 0 && (
          <div className="border-t border-white/5 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/1 text-xs">
            <span className="text-gray-400 font-light">
              Showing <span className="text-white font-semibold">{startIndex + 1}</span> to <span className="text-white font-semibold">{endIndex}</span> of <span className="text-white font-semibold">{totalItems}</span> registered users
            </span>

            <div className="flex items-center gap-4">
              {/* Page size adjustment */}
              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-light">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 rounded bg-[#0d0e12] border border-white/5 text-gray-300 font-bold outline-none cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              {/* Page indices navigation buttons */}
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="p-1.5 rounded-lg border border-white/5 hover:bg-white/5 text-gray-300 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                >
                  <FiChevronLeft className="h-4 w-4" />
                </button>
                <div className="text-gray-400 font-bold px-2">
                  Page <span className="text-white">{currentPage}</span> of {totalPages}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="p-1.5 rounded-lg border border-white/5 hover:bg-white/5 text-gray-300 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                >
                  <FiChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE USER MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#12131a] rounded-3xl border border-white/5 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-white/5 bg-white/1">
              <div className="flex items-center gap-2 text-white">
                <FiUsers className="h-5 w-5 text-[#e50914]" />
                <h3 className="text-lg font-black uppercase tracking-wide">Create User Credentials</h3>
              </div>
              <button 
                onClick={() => setIsCreateOpen(false)} 
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateUserSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {createError && (
                <div className="p-3 bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl font-bold">
                  {createError}
                </div>
              )}

              {/* Name */}
              <div className="space-y-1 text-left">
                <label className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter user's full name"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-[#0d0e12] text-white placeholder-gray-500 outline-none focus:border-red-500/30"
                />
              </div>

              {/* Email */}
              <div className="space-y-1 text-left">
                <label className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="Enter email address"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-[#0d0e12] text-white placeholder-gray-500 outline-none focus:border-red-500/30"
                />
              </div>

              {/* Password Generator Wrapper */}
              <div className="space-y-1 text-left relative">
                <div className="flex justify-between items-center">
                  <label className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Temporary Password</label>
                  <button
                    type="button"
                    onClick={() => handleGeneratePassword("create")}
                    className="text-[#e50914] hover:text-red-400 font-bold uppercase text-[9px] tracking-widest cursor-pointer"
                  >
                    Generate Strong Password
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Enter password (minimum 6 characters)"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-[#0d0e12] text-white placeholder-gray-500 outline-none focus:border-red-500/30 font-mono"
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-1 text-left">
                <label className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Confirm Password</label>
                <input
                  type="password"
                  required
                  placeholder="Confirm password selection"
                  value={createConfirmPassword}
                  onChange={(e) => setCreateConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-[#0d0e12] text-white placeholder-gray-500 outline-none focus:border-red-500/30"
                />
              </div>

              {/* Role & Account Type selectors Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">System Role</label>
                  <select
                    value={createRole}
                    onChange={(e) => setCreateRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/5 bg-[#0d0e12] text-white outline-none cursor-pointer focus:border-red-500/30"
                  >
                    <option value="user">User</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Account Type</label>
                  <select
                    value={createAccountType}
                    onChange={(e) => setCreateAccountType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/5 bg-[#0d0e12] text-white outline-none cursor-pointer focus:border-red-500/30"
                  >
                    <option value="normal">Normal User</option>
                    <option value="premium">Premium User</option>
                  </select>
                </div>
              </div>

              {/* Expiry date management */}
              {createAccountType === "premium" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in bg-white/2 p-3 rounded-2xl border border-white/5">
                  <div className="space-y-1 text-left">
                    <label className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Premium Expiry</label>
                    <select
                      value={createExpiryOption}
                      onChange={(e) => setCreateExpiryOption(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-white/5 bg-[#0d0e12] text-white outline-none cursor-pointer focus:border-red-500/30"
                    >
                      <option value="no-expiry">No Expiry (Lifetime)</option>
                      <option value="custom">Custom Date</option>
                    </select>
                  </div>
                  {createExpiryOption === "custom" && (
                    <div className="space-y-1 text-left animate-fade-in">
                      <label className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Expiry Date</label>
                      <input
                        type="date"
                        required
                        value={createExpiryDate}
                        onChange={(e) => setCreateExpiryDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-[#0d0e12] text-white outline-none cursor-pointer focus:border-red-500/30"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Status */}
              <div className="space-y-1 text-left">
                <label className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Initial Account Status</label>
                <select
                  value={createStatus}
                  onChange={(e) => setCreateStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/5 bg-[#0d0e12] text-white outline-none cursor-pointer focus:border-red-500/30"
                >
                  <option value="active">Active (Enabled)</option>
                  <option value="disabled">Disabled (Access Blocked)</option>
                </select>
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-6 py-2 rounded-xl bg-[#e50914] hover:bg-red-700 disabled:opacity-40 text-white font-bold transition-all cursor-pointer shadow-lg"
                >
                  {createLoading ? "Creating User..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREDENTIALS DISPLAY MODAL */}
      {isCredentialsOpen && summaryCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#12131a] rounded-3xl border border-white/5 shadow-2xl p-6 text-center text-xs animate-scale-up space-y-6">
            <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center text-2xl font-bold">
              ✔
            </div>
            
            <div className="space-y-1">
              <h3 className="text-lg font-black uppercase text-white tracking-wide">User Created Successfully</h3>
              <p className="text-gray-400 font-light">Copy these login details now. The temporary password will not be shown again.</p>
            </div>

            {/* Credentials box */}
            <div className="bg-[#0d0e12] border border-white/5 rounded-2xl p-5 text-left space-y-3 font-semibold shadow-inner">
              <h4 className="text-[#e50914] uppercase text-[10px] tracking-widest font-black border-b border-white/5 pb-2 mb-2">
                StreamApp Credentials
              </h4>
              <div className="flex justify-between">
                <span className="text-gray-500">Name:</span>
                <span className="text-white">{summaryCredentials.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email:</span>
                <span className="text-white font-mono">{summaryCredentials.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Temporary Password:</span>
                <span className="text-white font-mono text-sm bg-white/5 px-2 py-0.5 rounded">{summaryCredentials.password}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Account Type:</span>
                <span className="text-amber-500">{summaryCredentials.accountType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className="text-emerald-400">{summaryCredentials.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Expiry Date:</span>
                <span className="text-white">{summaryCredentials.expiry}</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const text = `STREAMAPP CREDENTIALS\nName: ${summaryCredentials.name}\nEmail: ${summaryCredentials.email}\nTemporary Password: ${summaryCredentials.password}\nAccount Type: ${summaryCredentials.accountType}\nExpiry: ${summaryCredentials.expiry}`;
                  handleCopyToClipboard(text, "Credentials summary copied to clipboard.");
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/5 font-bold transition-all cursor-pointer"
              >
                <FiCopy className="h-4.5 w-4.5" />
                Copy Credentials
              </button>
              <button
                onClick={() => setIsCredentialsOpen(false)}
                className="py-2.5 px-6 rounded-xl bg-[#e50914] hover:bg-red-700 text-white font-bold transition-all cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER PARAMETERS MODAL */}
      {isEditOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#12131a] rounded-3xl border border-white/5 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-white/5 bg-white/1">
              <div className="flex items-center gap-2 text-white">
                <FiEdit2 className="h-4.5 w-4.5 text-[#e50914]" />
                <h3 className="text-lg font-black uppercase tracking-wide">Edit User Profile</h3>
              </div>
              <button 
                onClick={() => setIsEditOpen(false)} 
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleUpdateUserSubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {editError && (
                <div className="p-3 bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl font-bold">
                  {editError}
                </div>
              )}

              {/* Email display (read-only) */}
              <div className="space-y-1 text-left">
                <label className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">Email Address (Non-modifiable)</label>
                <input
                  type="text"
                  disabled
                  value={selectedUser.email}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-white/2 text-gray-500 outline-none font-mono"
                />
              </div>

              {/* Name */}
              <div className="space-y-1 text-left">
                <label className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-[#0d0e12] text-white outline-none focus:border-red-500/30"
                />
              </div>

              {/* Role & Account Type Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">System Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/5 bg-[#0d0e12] text-white outline-none cursor-pointer focus:border-red-500/30"
                  >
                    <option value="user">User</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Account Type</label>
                  <select
                    value={editAccountType}
                    onChange={(e) => setEditAccountType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/5 bg-[#0d0e12] text-white outline-none cursor-pointer focus:border-red-500/30"
                  >
                    <option value="normal">Normal User</option>
                    <option value="premium">Premium User</option>
                  </select>
                </div>
              </div>

              {/* Expiry Customization */}
              {editAccountType === "premium" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/2 p-3 rounded-2xl border border-white/5">
                  <div className="space-y-1 text-left">
                    <label className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Premium Expiry</label>
                    <select
                      value={editExpiryOption}
                      onChange={(e) => setEditExpiryOption(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-white/5 bg-[#0d0e12] text-white outline-none cursor-pointer focus:border-red-500/30"
                    >
                      <option value="no-expiry">No Expiry (Lifetime)</option>
                      <option value="custom">Custom Date</option>
                    </select>
                  </div>
                  {editExpiryOption === "custom" && (
                    <div className="space-y-1 text-left">
                      <label className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Expiry Date</label>
                      <input
                        type="date"
                        required
                        value={editExpiryDate}
                        onChange={(e) => setEditExpiryDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-[#0d0e12] text-white outline-none cursor-pointer focus:border-red-500/30"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Status */}
              <div className="space-y-1 text-left">
                <label className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Account Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/5 bg-[#0d0e12] text-white outline-none cursor-pointer focus:border-red-500/30"
                >
                  <option value="active">Active (Enabled)</option>
                  <option value="disabled">Disabled (Access Blocked)</option>
                </select>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-6 py-2 rounded-xl bg-[#e50914] hover:bg-red-700 disabled:opacity-40 text-white font-bold transition-all cursor-pointer shadow-lg"
                >
                  {editLoading ? "Saving Changes..." : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {isResetOpen && resetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#12131a] rounded-3xl border border-white/5 shadow-2xl p-6 text-xs animate-scale-up space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="flex items-center gap-2 text-white">
                <FiKey className="h-4.5 w-4.5 text-[#e50914]" />
                <h3 className="text-base font-black uppercase tracking-wide">Reset Password</h3>
              </div>
              <button 
                onClick={() => setIsResetOpen(false)} 
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {resetSuccessCredentials ? (
              <div className="space-y-4 text-center">
                <div className="h-10 w-10 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20 flex items-center justify-center text-xl font-bold mx-auto">
                  ✔
                </div>
                <h4 className="text-white font-extrabold text-sm">Password Reset Complete</h4>
                <p className="text-gray-400 font-light leading-relaxed">
                  Provide this temporary password to the user. They can use it to log in immediately.
                </p>
                <div className="bg-[#0d0e12] border border-white/5 p-4 rounded-xl text-left space-y-2.5 font-semibold">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email:</span>
                    <span className="text-white font-mono">{resetSuccessCredentials.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">New Temporary Password:</span>
                    <span className="text-white font-mono text-sm bg-white/5 px-2 py-0.5 rounded">{resetSuccessCredentials.password}</span>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleCopyToClipboard(resetSuccessCredentials.password, "Temporary password copied to clipboard.")}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/5 font-bold transition-all cursor-pointer"
                  >
                    <FiCopy className="h-4 w-4" />
                    Copy Password
                  </button>
                  <button
                    onClick={() => setIsResetOpen(false)}
                    className="px-6 py-2 rounded-xl bg-[#e50914] hover:bg-red-700 text-white font-bold cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                {resetError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl font-bold">
                    {resetError}
                  </div>
                )}
                
                <p className="text-gray-400 font-light leading-relaxed">
                  Reset credentials for user <span className="text-white font-bold">{resetUser.name}</span> (<span className="text-white font-mono">{resetUser.email}</span>).
                </p>

                <div className="space-y-1 relative">
                  <div className="flex justify-between items-center">
                    <label className="text-gray-400 font-bold uppercase text-[9px] tracking-wider">New Password</label>
                    <button
                      type="button"
                      onClick={() => handleGeneratePassword("reset")}
                      className="text-[#e50914] hover:text-red-400 font-bold uppercase text-[9px] tracking-widest cursor-pointer"
                    >
                      Generate Password
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Enter new temporary password"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-[#0d0e12] text-white outline-none focus:border-red-500/30 font-mono"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsResetOpen(false)}
                    className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="px-6 py-2 rounded-xl bg-[#e50914] hover:bg-red-700 disabled:opacity-40 text-white font-bold transition-all cursor-pointer shadow-lg"
                  >
                    {resetLoading ? "Resetting..." : "Reset Credentials"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      {isDeleteOpen && deleteUserObj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#12131a] rounded-3xl border border-white/5 shadow-2xl p-6 text-xs animate-scale-up space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="flex items-center gap-2 text-white font-extrabold">
                <FiTrash2 className="h-4.5 w-4.5 text-[#e50914]" />
                <h3 className="text-base font-black uppercase tracking-wide">Delete User Account</h3>
              </div>
              <button 
                onClick={() => setIsDeleteOpen(false)} 
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {deleteError && (
              <div className="p-3 bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl font-bold">
                {deleteError}
              </div>
            )}

            <div className="space-y-2 leading-relaxed">
              <p className="text-gray-300">
                Are you absolutely sure you want to permanently delete the account of <span className="text-white font-bold">{deleteUserObj.name}</span> (<span className="text-white font-mono">{deleteUserObj.email}</span>)?
              </p>
              <div className="p-3 bg-red-500/10 border border-red-500/15 text-red-400 rounded-xl font-bold flex gap-2">
                <span>⚠</span>
                <span>Warning: This will delete their credentials from Firebase Authentication and erase their profile metadata from MongoDB. This action is irreversible.</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="px-6 py-2 rounded-xl bg-[#e50914] hover:bg-red-700 disabled:opacity-40 text-white font-bold transition-all cursor-pointer shadow-lg"
              >
                {deleteLoading ? "Deleting Account..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUDIT LOGS MODAL */}
      {isAuditLogsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#12131a] rounded-3xl border border-white/5 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-up">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-white/5 bg-white/1">
              <div className="flex items-center gap-2 text-white">
                <FiFileText className="h-5 w-5 text-[#e50914]" />
                <h3 className="text-lg font-black uppercase tracking-wide">Admin Action Audit Logs</h3>
              </div>
              <button 
                onClick={() => setIsAuditLogsOpen(false)} 
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {/* Logs Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {logsError && (
                <div className="p-3 bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl text-xs font-bold">
                  {logsError}
                </div>
              )}

              {logsLoading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#e50914] border-t-transparent"></div>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="p-16 text-center text-gray-500 font-light text-sm">
                  No historical administrative activities logged in the database.
                </div>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log, idx) => (
                    <div key={log._id || idx} className="bg-white/2 border border-white/5 p-3.5 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs font-semibold text-gray-300 hover:bg-white/3 transition-colors">
                      <div className="space-y-1.5 text-left">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-white font-extrabold bg-white/5 border border-white/5 px-2 py-0.5 rounded text-[10px]">
                            {log.adminName} ({log.adminEmail})
                          </span>
                          <span className="text-[#e50914] font-black uppercase tracking-wider text-[9px]">&#187;</span>
                          <span className="text-emerald-400 font-extrabold">{log.action}</span>
                        </div>
                        {log.targetUser && (
                          <p className="text-[10px] text-gray-500 font-normal">
                            Target User: <span className="font-mono text-gray-400">{log.targetUser}</span>
                          </p>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500 sm:text-right font-normal font-mono">
                        {new Date(log.timestamp).toLocaleString("en-IN")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4.5 border-t border-white/5 bg-white/1 flex justify-end">
              <button
                type="button"
                onClick={() => setIsAuditLogsOpen(false)}
                className="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
