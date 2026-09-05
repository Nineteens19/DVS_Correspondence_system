# ==========================================
# Stage 1: Build Frontend (React Vite SPA)
# ==========================================
FROM node:22-alpine AS client-builder
WORKDIR /app/src/Correspondence.Client

# Install dependencies
COPY src/Correspondence.Client/package*.json ./
RUN npm install

# Copy frontend source and build (outputs to /app/src/Correspondence.Api/wwwroot)
COPY src/Correspondence.Client/ ./
RUN npm run build

# ==========================================
# Stage 2: Build Backend (.NET 8 Web API)
# ==========================================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS dotnet-builder
WORKDIR /src

# Copy solution and project files for layer caching
COPY CorrespondenceSystem.sln ./
COPY src/Correspondence.Domain/Correspondence.Domain.csproj src/Correspondence.Domain/
COPY src/Correspondence.Application/Correspondence.Application.csproj src/Correspondence.Application/
COPY src/Correspondence.Infrastructure/Correspondence.Infrastructure.csproj src/Correspondence.Infrastructure/
COPY src/Correspondence.Api/Correspondence.Api.csproj src/Correspondence.Api/
COPY src/Correspondence.Tests/Correspondence.Tests.csproj src/Correspondence.Tests/

# Restore dependencies
RUN dotnet restore CorrespondenceSystem.sln

# Copy all source files
COPY src/ ./src/

# Copy built frontend assets from client-builder into wwwroot
COPY --from=client-builder /app/src/Correspondence.Api/wwwroot ./src/Correspondence.Api/wwwroot

# Publish the API project
WORKDIR /src/src/Correspondence.Api
RUN dotnet publish Correspondence.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# ==========================================
# Stage 3: Runtime (.NET 8 ASP.NET Core)
# ==========================================
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Create upload directory for documents
RUN mkdir -p /app/App_Data/uploads

# Copy published application
COPY --from=dotnet-builder /app/publish .

# Set default environment variables
ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    Database__Provider=SqlServer \
    Storage__BasePath=App_Data/uploads

EXPOSE 8080

ENTRYPOINT ["dotnet", "Correspondence.Api.dll"]
