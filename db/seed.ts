import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";
import {
  DEFAULT_ADMIN,
  DEFAULT_FACEBOOK_URL,
  DEFAULT_FAQ_ENTRIES,
  DEFAULT_HERO_IMAGE_URL,
  DEFAULT_INSTAGRAM_URL,
  DEFAULT_SEE_MORE_LINKS,
  DEFAULT_TESTIMONIAL_ENTRIES,
  DEFAULT_INTAKES,
  DEFAULT_MEMBERS,
  DEFAULT_CADET_QUOTES,
  DEFAULT_CADET_DISPLAY_PHOTO_URL,
  DEFAULT_CADETS_INFO,
  DEFAULT_STUDY_PROGRAMS,
  DEFAULT_TESTIMONIAL_ARMY_NOS,
  DEFAULT_PROGRAMS,
  DEFAULT_PROGRAM_TAGS,
} from "../lib/data";
import { computeAcademicSchedule } from "@/lib/utils";

function loadDotEnv() {
  const envPath = resolve(process.cwd(), ".env");

  if (!existsSync(envPath)) {
    return;
  }

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);

    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;

    if (process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

loadDotEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
  prepare: false,
});

async function seed() {
  await sql`
    TRUNCATE TABLE
      testimonial_translations,
      testimonials,
      cadet_infos,
      members,
      sessions,
      academic_years,
      intake_display_photos,
      intake_patch_explanation_translations,
      intake_patch_explanations,
      intake_translations,
      intakes,
      frequently_asked_question_translations,
      frequently_asked_questions,
      see_more_links,
      webapp_contents,
      admin_users,
      study_programs,
      program_display_photos,
      programs_to_tags,
      program_tag_translations,
      program_tags,
      program_translations,
      programs
    RESTART IDENTITY CASCADE
  `;

  const studyProgramIds: number[] = [];

  for (const program of DEFAULT_STUDY_PROGRAMS) {
    const [row] = await sql<[{ id: number }]>`
      insert into study_programs (slug, name, is_active)
      values (${program.slug}, ${program.name}, true)
      returning id
    `;

    studyProgramIds.push(row.id);
  }

  await sql`
    insert into admin_users (
      auth_user_id,
      email,
      full_name,
      role,
      is_active
    )
    values (
      ${DEFAULT_ADMIN.authUserId},
      ${DEFAULT_ADMIN.email},
      ${DEFAULT_ADMIN.fullName},
      ${DEFAULT_ADMIN.role},
      true
    )
  `;

  const [webappContent] = await sql<[{ id: number }]>`
    insert into webapp_contents (
      singleton_key,
      hero_image_url,
      facebook_url,
      instagram_url
    )
    values (
      true,
      ${DEFAULT_HERO_IMAGE_URL},
      ${DEFAULT_FACEBOOK_URL},
      ${DEFAULT_INSTAGRAM_URL}
    )
    returning id
  `;

  for (let i = 0; i < DEFAULT_FAQ_ENTRIES.length; i += 1) {
    const faq = DEFAULT_FAQ_ENTRIES[i];

    const [faqRow] = await sql<[{ id: number }]>`
      insert into frequently_asked_questions (
        webapp_content_id,
        sort_order,
        status
      )
      values (
        ${webappContent.id},
        ${i + 1},
        'PUBLISHED'
      )
      returning id
    `;

    for (const locale of ["en", "ms", "zh", "ta"] as const) {
      const translation = faq[locale];

      await sql`
        insert into frequently_asked_question_translations (
          faq_id,
          locale,
          question,
          answer
        )
        values (
          ${faqRow.id},
          ${locale},
          ${translation.question},
          ${translation.answer}
        )
      `;
    }
  }

  for (let i = 0; i < DEFAULT_SEE_MORE_LINKS.length; i += 1) {
    const entry = DEFAULT_SEE_MORE_LINKS[i];

    await sql`
      insert into see_more_links (
        webapp_content_id,
        title,
        link,
        image_url,
        sort_order,
        status
      )
      values (
        ${webappContent.id},
        ${entry.title},
        ${entry.link},
        ${entry.imageUrl},
        ${i + 1},
        'PUBLISHED'
      )
    `;
  }

  const intakeIds: number[] = [];

  for (const intake of DEFAULT_INTAKES) {
    const [intakeRow] = await sql<[{ id: number }]>`
      insert into intakes (
        intake_no,
        display_name,
        slug,
        status,
        start_year,
        color,
        tag_line,
        cover_photo_path,
        patch_photo_path,
        inner_photo_path,
        tshirt_photo_path
      )
      values (
        ${intake.intakeNo},
        ${intake.displayName},
        ${intake.slug},
        'PUBLISHED',
        ${intake.startYear},
        ${intake.color},
        ${intake.tagLine},
        ${intake.coverPhotoPath},
        ${intake.patchPhotoPath},
        ${intake.innerPhotoPath},
        ${intake.tshirtPhotoPath}
      )
      returning id
    `;

    intakeIds.push(intakeRow.id);

    for (const locale of ["en", "ms", "zh", "ta"] as const) {
      const translation = intake.translations[locale];

      await sql`
        insert into intake_translations (
          intake_id,
          locale,
          summary,
          seo_title,
          seo_description
        )
        values (
          ${intakeRow.id},
          ${locale},
          ${translation.summary},
          ${translation.seoTitle},
          ${translation.seoDescription}
        )
      `;
    }

    for (const key of ["ANIMAL", "COLOR", "PHILOSOPHY"] as const) {
      const [patchRow] = await sql<[{ id: number }]>`
        insert into intake_patch_explanations (
          intake_id,
          key
        )
        values (
          ${intakeRow.id},
          ${key}
        )
        returning id
      `;

      const translations = intake.patchExplanations[key];

      for (const locale of ["en", "ms", "zh", "ta"] as const) {
        await sql`
          insert into intake_patch_explanation_translations (
            patch_explanation_id,
            locale,
            value
          )
          values (
            ${patchRow.id},
            ${locale},
            ${translations[locale]}
          )
        `;
      }
    }

    for (const photoPath of intake.displayPhotos) {
      await sql`
        insert into intake_display_photos (
          intake_id,
          photo_path
        )
        values (
          ${intakeRow.id},
          ${photoPath}
        )
      `;
    }

    const schedule = computeAcademicSchedule(intake.startYear);

    for (const { yearNumber, calendarYear, sessions } of schedule) {
      const [yearRow] = await sql<[{ id: number }]>`
        insert into academic_years (
          intake_id,
          year_number,
          calendar_year
        )
        values (
          ${intakeRow.id},
          ${yearNumber},
          ${calendarYear}
        )
        returning id
      `;

      for (const { sessionNumber } of sessions) {
        await sql`
          insert into sessions (
            academic_year_id,
            session_number
          )
          values (
            ${yearRow.id},
            ${sessionNumber}
          )
        `;
      }
    }
  }

  for (const m of DEFAULT_MEMBERS) {
    await sql`
      insert into members (
        army_no,
        rank,
        name,
        email,
        display_name,
        gender,
        role,
        religion,
        race,
        address,
        red_bg_photo_path,
        blue_bg_photo_path
      )
      values (
        ${m.armyNo},
        ${m.rank},
        ${m.name},
        ${m.email},
        ${m.displayName},
        ${m.gender},
        ${m.role},
        ${m.religion},
        ${m.race},
        ${m.address},
        ${m.redBgPhotoPath},
        ${m.blueBgPhotoPath}
      )
    `;
  }

  for (let i = 0; i < DEFAULT_CADETS_INFO.length; i += 1) {
    const c = DEFAULT_CADETS_INFO[i];

    const [memberRow] = await sql<[{ id: number }]>`
      select id from members
      where army_no = ${c.armyNo}
    `;

    if (!memberRow) continue;

    const intakeId = intakeIds[i % intakeIds.length];
    const studyProgramId = studyProgramIds[i % studyProgramIds.length];

    await sql`
      insert into cadet_infos (
        matric_no,
        is_active,
        quote,
        display_photo_path,
        study_program_id,
        intake_id,
        member_id
      )
      values (
        ${"MAT-" + c.armyNo},
        true,
        ${DEFAULT_CADET_QUOTES[i % DEFAULT_CADET_QUOTES.length]},
        ${DEFAULT_CADET_DISPLAY_PHOTO_URL},
        ${studyProgramId},
        ${intakeId},
        ${memberRow.id}
      )
    `;
  }

  for (let i = 0; i < DEFAULT_TESTIMONIAL_ENTRIES.length; i += 1) {
    const testimonial = DEFAULT_TESTIMONIAL_ENTRIES[i];
    const armyNo = DEFAULT_TESTIMONIAL_ARMY_NOS[i];

    const [memberRow] = await sql<[{ id: number }]>`
      select id from members
      where army_no = ${armyNo}
    `;

    if (!memberRow) continue;

    const [testimonialRow] = await sql<[{ id: number }]>`
      insert into testimonials (
        member_id,
        status,
        sort_order
      )
      values (
        ${memberRow.id},
        'PUBLISHED',
        ${i + 1}
      )
      returning id
    `;

    for (const locale of ["en", "ms", "zh", "ta"] as const) {
      await sql`
        insert into testimonial_translations (
          testimonial_id,
          locale,
          content
        )
        values (
          ${testimonialRow.id},
          ${locale},
          ${testimonial.translations[locale]}
        )
      `;
    }
  }

  const tagIdMap = new Map<string, number>();

  for (const tag of DEFAULT_PROGRAM_TAGS) {
    const [tagRow] = await sql<[{ id: number }]>`
    insert into program_tags (
      slug
    )
    values (
      ${tag}
    )
    returning id
  `;

    tagIdMap.set(tag, tagRow.id);

    for (const locale of ["en", "ms", "zh", "ta"] as const) {
      await sql`
      insert into program_tag_translations (
        tag_id,
        locale,
        name
      )
      values (
        ${tagRow.id},
        ${locale},
        ${tag.replace(/-/g, " ")}
      )
    `;
    }
  }

  for (const program of DEFAULT_PROGRAMS) {
    const [programRow] = await sql<[{ id: number }]>`
    insert into programs (
      name,
      slug,
      start_date,
      end_date,
      location,
      participant_count,
      cover_photo_path,
      cover_photo_width,
      cover_photo_height,
      video_url,
      status
    )
    values (
      ${program.name},
      ${program.slug},
      ${program.startDate.toISOString()},
      ${program.endDate.toISOString()},
      ${program.location},
      ${program.participantCount},
      ${program.coverPhotoPath},
      ${program.coverPhotoWidth},
      ${program.coverPhotoHeight},
      ${program.videoUrl},
      'PUBLISHED'
    )
    returning id
  `;

    for (const locale of ["en", "ms", "zh", "ta"] as const) {
      const translation = program.translations[locale];

      await sql`
      insert into program_translations (
        program_id,
        locale,
        title,
        summary,
        seo_title,
        seo_description
      )
      values (
        ${programRow.id},
        ${locale},
        ${translation.title},
        ${translation.summary},
        ${translation.seoTitle},
        ${translation.seoDescription}
      )
    `;
    }

    for (const photo of program.displayPhotos) {
      await sql`
      insert into program_display_photos (
        program_id,
        photo_path
      )
      values (
        ${programRow.id},
        ${photo}
      )
    `;
    }

    for (const tag of program.tags) {
      const tagId = tagIdMap.get(tag);

      if (!tagId) continue;

      await sql`
      insert into programs_to_tags (
        program_id,
        tag_id
      )
      values (
        ${programRow.id},
        ${tagId}
      )
    `;
    }
  }
}

seed()
  .then(async () => {
    console.log(`Seeded successfully.`);
    await sql.end();
  })
  .catch(async (error) => {
    console.error(error);
    await sql.end();
    process.exit(1);
  });