using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace fuzfriend.ProductsApi.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddedTitle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Name",
                table: "Products",
                newName: "Title");

            migrationBuilder.RenameColumn(
                name: "IsOnPromotion",
                table: "Products",
                newName: "OnPromotion");

            migrationBuilder.RenameColumn(
                name: "Image",
                table: "Products",
                newName: "Description");

            migrationBuilder.RenameColumn(
                name: "Colour",
                table: "Products",
                newName: "Color");

            migrationBuilder.AddColumn<List<string>>(
                name: "ImageUrls",
                table: "Products",
                type: "text[]",
                nullable: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageUrls",
                table: "Products");

            migrationBuilder.RenameColumn(
                name: "Title",
                table: "Products",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "OnPromotion",
                table: "Products",
                newName: "IsOnPromotion");

            migrationBuilder.RenameColumn(
                name: "Description",
                table: "Products",
                newName: "Image");

            migrationBuilder.RenameColumn(
                name: "Color",
                table: "Products",
                newName: "Colour");
        }
    }
}
