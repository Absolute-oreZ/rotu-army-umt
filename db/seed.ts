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
  DEFAULT_CADET_PHYSICAL,
  DEFAULT_OFFICERS_AND_INSTRUCTORS,
  DEFAULT_STUDY_PROGRAMS,
  DEFAULT_TESTIMONIAL_ARMY_NOS,
  DEFAULT_EVENTS,
  DEFAULT_EVENT_TAGS,
  DEFAULT_GOOGLE_MAP_LOCATION_URL,
  DEFAULT_OFFICIAL_EMAIL,
  DEFAULT_CONTACT_REASONS,
  DEFAULT_YOUTUBE_URL,
  DEFAULT_TIKTOK_URL,
  DEFAULT_X_URL,
  DEFAULT_BLUE_BG_PHOTO_URL,
} from "../lib/data";
import { calculateBMI, computeAcademicSchedule } from "@/lib/utils";

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
      officers_and_instructors,
      cadets,
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
      event_display_photos,
      events_to_tags,
      event_tag_translations,
      event_tags,
      event_translations,
      events,
      contact_reasons,
      contact_reason_translations,
      newsletter_subscribers,
      admin_role_audit_logs
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

  const [adminMemberRow] = await sql<[{ id: number }]>`
    insert into members (
      army_no,
      rank,
      name,
      personal_email,
      edu_email,
      display_name,
      gender,
      role,
      religion,
      race,
      address,
      birthdate,
      age,
      kor,
      red_bg_photo_path,
      blue_bg_photo_path
    )
    values (
      2099,
      'MAJOR',
      ${DEFAULT_ADMIN.fullName},
      ${DEFAULT_ADMIN.personalEmail},
      ${DEFAULT_ADMIN.personalEmail},
      'Yong',
      'MALE',
      'OFFICER',
      'CHRISTIAN',
      'CHINESE',
      'Kuala Lumpur',
      '2000-01-01',
      26,
      'Rejimen Askar Wataniah (RAW)',
      ${DEFAULT_CADET_DISPLAY_PHOTO_URL},
      ${DEFAULT_BLUE_BG_PHOTO_URL}
    )
    returning id
  `;

  await sql`
    insert into admin_users (
      auth_user_id,
      member_id,
      email,
      role
    )
    values (
      ${DEFAULT_ADMIN.authUserId},
      ${adminMemberRow.id},
      ${DEFAULT_ADMIN.personalEmail},
      ${DEFAULT_ADMIN.role}
    )
  `;

  const [webappContent] = await sql<[{ id: number }]>`
    insert into webapp_contents (
      singleton_key,
      hero_image_url,
      facebook_url,
      instagram_url,
      youtube_url,
      tiktok_url,
      x_url,
      google_map_location_url,
      official_email
    )
    values (
      true,
      ${DEFAULT_HERO_IMAGE_URL},
      ${DEFAULT_FACEBOOK_URL},
      ${DEFAULT_INSTAGRAM_URL},
      ${DEFAULT_YOUTUBE_URL},
      ${DEFAULT_TIKTOK_URL},
      ${DEFAULT_X_URL},
      ${DEFAULT_GOOGLE_MAP_LOCATION_URL},
      ${DEFAULT_OFFICIAL_EMAIL}
    )
    returning id
  `;

  for (const reason of DEFAULT_CONTACT_REASONS) {
    const [reasonRow] = await sql<[{ id: number }]>`
      insert into contact_reasons (
        icon_key,
        sort_order
      )
      values (
        ${reason.iconKey},
        ${reason.sortOrder}
      )
      returning id
    `;

    for (const locale of ["en", "ms", "zh", "ta"] as const) {
      const translation = reason.translations[locale];
      await sql`
        insert into contact_reason_translations (
          reason_id,
          locale,
          title,
          description
        )
        values (
          ${reasonRow.id},
          ${locale},
          ${translation.title},
          ${translation.description}
        )
      `;
    }
  }

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
        personal_email,
        edu_email,
        display_name,
        gender,
        role,
        religion,
        race,
        address,
        birthdate,
        age,
        kor,
        red_bg_photo_path,
        blue_bg_photo_path
      )
      values (
        ${m.armyNo},
        ${m.rank},
        ${m.name},
        ${m.personalEmail},
        ${m.personalEmail},
        ${m.displayName},
        ${m.gender},
        ${m.role},
        ${m.religion},
        ${m.race},
        ${m.address},
        ${m.birthdate},
        ${m.age},
        ${m.kor},
        ${m.redBgPhotoPath},
        ${m.blueBgPhotoPath}
      )
    `;
  }

  for (let i = 0; i < DEFAULT_CADETS_INFO.length; i += 1) {
    const c = DEFAULT_CADETS_INFO[i];
    const physical = DEFAULT_CADET_PHYSICAL[i % DEFAULT_CADET_PHYSICAL.length];

    const [memberRow] = await sql<[{ id: number }]>`
      select id from members
      where army_no = ${c.armyNo}
    `;

    if (!memberRow) continue;

    const intakeId = intakeIds[i % intakeIds.length];
    const studyProgramId = studyProgramIds[i % studyProgramIds.length];
    const bmi = calculateBMI(physical.height, physical.weight) ?? 0;

    await sql`
      insert into cadets (
        matric_no,
        is_active,
        quote,
        display_photo_path,
        cgpa,
        height,
        weight,
        bmi,
        study_program_id,
        intake_id,
        member_id
      )
      values (
        ${"MAT-" + c.armyNo},
        true,
        ${DEFAULT_CADET_QUOTES[i % DEFAULT_CADET_QUOTES.length]},
        ${DEFAULT_CADET_DISPLAY_PHOTO_URL},
        ${physical.cgpa},
        ${physical.height},
        ${physical.weight},
        ${bmi},
        ${studyProgramId},
        ${intakeId},
        ${memberRow.id}
      )
    `;
  }

  for (const oi of DEFAULT_OFFICERS_AND_INSTRUCTORS) {
    const [memberRow] = await sql<[{ id: number }]>`
      select id from members
      where army_no = ${oi.armyNo}
    `;

    if (!memberRow) continue;

    await sql`
      insert into officers_and_instructors (
        member_id,
        is_active,
        year_of_experience
      )
      values (
        ${memberRow.id},
        ${oi.isActive},
        ${oi.yearOfExperience}
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

  for (const tag of DEFAULT_EVENT_TAGS) {
    const [tagRow] = await sql<[{ id: number }]>`
    insert into event_tags (
      slug
    )
    values (
      ${tag.slug}
    )
    returning id
  `;

    tagIdMap.set(tag.slug, tagRow.id);

    for (const locale of ["en", "ms", "zh", "ta"] as const) {
      await sql`
      insert into event_tag_translations (
        tag_id,
        locale,
        name
      )
      values (
        ${tagRow.id},
        ${locale},
        ${tag.translations[locale]}
      )
    `;
    }
  }

  for (const event of DEFAULT_EVENTS) {
    const [eventRow] = await sql<[{ id: number }]>`
    insert into events (
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
      ${event.name},
      ${event.slug},
      ${event.startDate.toISOString()},
      ${event.endDate.toISOString()},
      ${event.location},
      ${event.participantCount},
      ${event.coverPhotoPath},
      ${event.coverPhotoWidth},
      ${event.coverPhotoHeight},
      ${event.videoUrl},
      'PUBLISHED'
    )
    returning id
  `;

    for (const locale of ["en", "ms", "zh", "ta"] as const) {
      const translation = event.translations[locale];

      await sql`
      insert into event_translations (
        event_id,
        locale,
        title,
        summary,
        seo_title,
        seo_description
      )
      values (
        ${eventRow.id},
        ${locale},
        ${translation.title},
        ${translation.summary},
        ${translation.seoTitle},
        ${translation.seoDescription}
      )
    `;
    }

    for (const photo of event.displayPhotos) {
      await sql`
      insert into event_display_photos (
        event_id,
        photo_path
      )
      values (
        ${eventRow.id},
        ${photo}
      )
    `;
    }

    for (const tag of event.tags) {
      const tagId = tagIdMap.get(tag);

      if (!tagId) continue;

      await sql`
      insert into events_to_tags (
        event_id,
        tag_id
      )
      values (
        ${eventRow.id},
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