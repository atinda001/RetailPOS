-- CreateIndex
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Sale_tenantId_createdAt_idx" ON "Sale"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Sale_tenantId_storeId_createdAt_idx" ON "Sale"("tenantId", "storeId", "createdAt");

-- CreateIndex
CREATE INDEX "Sale_tenantId_cashierId_idx" ON "Sale"("tenantId", "cashierId");

-- CreateIndex
CREATE INDEX "Sale_offlineId_idx" ON "Sale"("offlineId");

-- CreateIndex
CREATE INDEX "Shift_tenantId_status_terminalId_idx" ON "Shift"("tenantId", "status", "terminalId");

-- CreateIndex
CREATE INDEX "Shift_tenantId_cashierId_status_idx" ON "Shift"("tenantId", "cashierId", "status");

-- CreateIndex
CREATE INDEX "StockMovement_stockItemId_createdAt_idx" ON "StockMovement"("stockItemId", "createdAt");
