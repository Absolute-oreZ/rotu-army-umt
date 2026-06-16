CREATE TYPE "public"."bmi_classification" AS ENUM('UNDERWEIGHT', 'NORMAL', 'OVERWEIGHT', 'OBESE');--> statement-breakpoint
ALTER TABLE "cadets" ADD COLUMN "bmi_classification" "bmi_classification";