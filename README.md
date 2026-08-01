# Asset Flood Monitor

# Enterprise Flood Impact Assessment Platform

I want you to act as a Senior GIS Solution Architect, React Developer, UX Designer and Enterprise Software Engineer.

Build a modern enterprise GIS web application called

"Enterprise Flood Impact Assessment Platform"

The application is a Proof of Concept for National Grid UK.

The objective is simple.

Allow a user to visualise National Grid electricity assets together with Environment Agency Flood Warning Areas and automatically determine which assets are affected by flooding using GIS spatial analysis.

Do NOT build an AI application.

Do NOT build a chatbot.

Do NOT build predictive analytics.

Do NOT build a complex control room.

The application should focus on one thing and do it exceptionally well:

"Identify electricity assets that are currently impacted by flood warning areas."

This application should resemble professional GIS software such as ArcGIS Experience Builder or Azure Maps rather than a business intelligence dashboard.

----------------------------------------------------

TECHNOLOGY

----------------------------------------------------

Build using modern React.

Use

React

TypeScript

Tailwind CSS

shadcn/ui

React Leaflet (or equivalent)

Reusable components

The application should be modular and production ready.

----------------------------------------------------

APPLICATION LAYOUT

----------------------------------------------------

Use a professional enterprise layout.

Top Header

Left Navigation

Main GIS Map

Right Information Panel

Bottom Status Bar

The GIS Map should occupy approximately 70% of the screen because it is the most important component.

----------------------------------------------------

LEFT NAVIGATION

----------------------------------------------------

Dashboard

Map

Assets at Risk

About

----------------------------------------------------

HEADER

----------------------------------------------------

Application Title

Enterprise Flood Impact Assessment Platform

Current Date

Search Bar

Layer Toggle Button

Reset Map Button

----------------------------------------------------

DASHBOARD

----------------------------------------------------

Create a clean executive summary.

Display KPI cards.

Flood Warning Areas

Total Substations

Total OHL

Total Underground Cables

Substations At Risk

OHL At Risk

Cables At Risk

High Risk Assets

Medium Risk Assets

Low Risk Assets

The dashboard should also include

Assets by Type

Risk Distribution

Assets at Risk by Category

Recent Spatial Analysis Summary

The dashboard should not contain unnecessary charts.

----------------------------------------------------

MAP PAGE

----------------------------------------------------

This is the primary screen.

Display all uploaded GIS layers.

Flood Warning Areas

Substations

Overhead Lines

Underground Cables

Provide

Zoom

Pan

Scale

Fullscreen

Layer Control

Search

Legend

Home Button

Reset Button

The application should automatically zoom to the loaded data.

----------------------------------------------------

LAYER STYLING

----------------------------------------------------

Flood Warning Areas

Semi-transparent blue polygons

Blue outline

Substations

Blue square marker

Overhead Lines

Orange polylines

Underground Cables

Green polylines

Assets At Risk

Red

Medium Risk

Orange

Low Risk

Yellow

Normal Assets

Default colours

----------------------------------------------------

SPATIAL ANALYSIS

----------------------------------------------------

This is the core functionality of the application.

Automatically perform GIS spatial analysis once all layers are loaded.

Determine

Which substations fall inside Flood Warning Areas.

Which Overhead Lines intersect Flood Warning Areas.

Which Underground Cables intersect Flood Warning Areas.

Generate a risk classification.

HIGH

Asset completely inside a Flood Warning Area.

MEDIUM

Asset intersects a Flood Warning Area.

LOW

Asset is within a configurable buffer distance from a Flood Warning Area.

SAFE

No spatial relationship exists.

Do not use AI.

Do not generate random scores.

Risk classification must be based only on GIS geometry.

----------------------------------------------------

MAP INTERACTION

----------------------------------------------------

Clicking a Flood Warning Area should

Highlight the polygon.

Highlight every affected asset.

Display a summary.

Example

Flood Warning Area

River Avon at Warwick

Affected Assets

Substations

3

OHL

12

Cables

4

----------------------------------------------------

Clicking a Substation should

Highlight the Substation

Highlight the intersecting Flood Warning Area

Display an information panel

----------------------------------------------------

Clicking an OHL should

Highlight the entire line

Highlight intersecting Flood Areas

----------------------------------------------------

Clicking a Cable should

Highlight the cable

Highlight intersecting Flood Areas

----------------------------------------------------

RIGHT INFORMATION PANEL

----------------------------------------------------

Display detailed information for the selected feature.

For Flood Warning Areas display

Flood Warning Name

River

Local Authority

Description

Affected Assets

Substations

OHL

Cables

----------------------------------------------------

For Substations display

Substation Name

Voltage

Status

Risk Level

Flood Warning Area

Coordinates

----------------------------------------------------

For OHL display

Circuit Name

Voltage

Tower Section

Status

Risk Level

Intersecting Flood Area

----------------------------------------------------

For Underground Cable display

Cable Route

Voltage

Cable Type

Status

Risk Level

Intersecting Flood Area

----------------------------------------------------

ATTRIBUTE MAPPING

----------------------------------------------------

Use these shapefile fields.

SUBSTATIONS

Display Name

Substation

Voltage

OPERATING_

Status

STATUS

Internal ID

GDO_GID

----------------------------------------------------

OVERHEAD LINES

Display Name

CIRCUIT1

Voltage

OPERATING_

Tower Section

Towers_In

Status

STATUS

Internal ID

GDO_GID

----------------------------------------------------

UNDERGROUND CABLES

Display Name

CABLE_ROUT

Voltage

OPERATING_

Cable Type

CABLE_TYPE

Status

STATUS

Internal ID

GDO_GID

----------------------------------------------------

FLOOD WARNING AREAS

Display Name

ta_name

River

river_sea

Local Authority

la_name

Description

descrip

Internal ID

fws_tacode

----------------------------------------------------

ASSETS AT RISK PAGE

----------------------------------------------------

Create a searchable table.

Columns

Asset Name

Asset Type

Risk Level

Flood Warning Area

Status

Selecting a row should automatically zoom the map to the selected asset.

----------------------------------------------------

SEARCH

----------------------------------------------------

Allow searching by

Substation Name

Circuit Name

Cable Route

Flood Warning Area

----------------------------------------------------

LEGEND

----------------------------------------------------

Provide a professional GIS legend.

Blue Polygon

Flood Warning Area

Blue Square

Substation

Orange Line

Overhead Line

Green Line

Underground Cable

Red

High Risk

Orange

Medium Risk

Yellow

Low Risk

----------------------------------------------------

COLOUR THEMES

----------------------------------------------------

Use a professional dark enterprise theme.

Dark navy background.

Blue highlights.

Minimal gradients.

No bright colours.

Avoid excessive animations.

The application should resemble enterprise GIS software used by utility companies.

----------------------------------------------------

IMPORTANT REQUIREMENTS

----------------------------------------------------

Design the application to read the uploaded shapefiles directly.

Do not hardcode asset data.

Automatically populate the map and tables from the uploaded GIS files.

The application should work even if the uploaded shapefiles contain different numbers of assets.

Keep the GIS logic separate from the UI components.

Use reusable React components.

Keep the code clean and modular.

----------------------------------------------------

PROJECT STRUCTURE

----------------------------------------------------

Before writing any code,

first generate

1. Overall architecture

2. Folder structure

3. Component hierarchy

4. Routing

5. GIS workflow

6. Spatial analysis workflow

7. Data loading workflow

8. UI mock-up

Only after I approve the architecture should you begin implementing the application incrementally.

Do not attempt to generate the complete application in one response.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://asset-flood-watch.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/414659aa-f391-47b0-b078-43b462f00315).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
