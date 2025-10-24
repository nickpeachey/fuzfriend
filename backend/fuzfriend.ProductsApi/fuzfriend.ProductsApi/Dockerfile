FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["fuzfriend.ProductsApi/fuzfriend.ProductsApi.csproj", "fuzfriend.ProductsApi/"]
RUN dotnet restore "fuzfriend.ProductsApi/fuzfriend.ProductsApi.csproj"
COPY . .
WORKDIR "/src/fuzfriend.ProductsApi"
RUN dotnet build "./fuzfriend.ProductsApi.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./fuzfriend.ProductsApi.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "fuzfriend.ProductsApi.dll"]
