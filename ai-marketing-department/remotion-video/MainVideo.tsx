import React from "react";
import { Sequence, useVideoConfig } from "remotion";
import { IntroScene } from "./scenes/IntroScene";
import { OrgChartScene } from "./scenes/OrgChartScene";
import { DepartmentScene } from "./scenes/DepartmentScene";
import { WorkflowScene } from "./scenes/WorkflowScene";
import { StatsScene } from "./scenes/StatsScene";
import { CTAScene } from "./scenes/CTAScene";
import { getDepartments } from "./utils/agentData";
import { departmentColors, departmentNames } from "./utils/colors";

// Scene timing configuration (in frames at 30fps)
const SCENE_TIMING = {
  intro: { start: 0, duration: 150 }, // 5 seconds
  orgChart: { start: 150, duration: 450 }, // 15 seconds
  departments: { start: 600, duration: 1800 }, // 60 seconds (6 depts × 10s)
  workflow: { start: 2400, duration: 600 }, // 20 seconds
  stats: { start: 3000, duration: 300 }, // 10 seconds
  cta: { start: 3300, duration: 300 }, // 10 seconds
};

// Department duration (10 seconds each)
const DEPT_DURATION = 300;

export const MainVideo: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  const departments = getDepartments();

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: "#0a0a0a",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {/* Scene 1: Intro */}
      <Sequence from={SCENE_TIMING.intro.start} durationInFrames={SCENE_TIMING.intro.duration}>
        <IntroScene />
      </Sequence>

      {/* Scene 2: Org Chart Overview */}
      <Sequence from={SCENE_TIMING.orgChart.start} durationInFrames={SCENE_TIMING.orgChart.duration}>
        <OrgChartScene />
      </Sequence>

      {/* Scene 3: Department Spotlights (6 departments × 10 seconds each) */}
      {departments.map((dept, index) => {
        const deptKey = dept as keyof typeof departmentColors;
        const colors = departmentColors[deptKey];
        const name = departmentNames[deptKey];

        return (
          <Sequence
            key={dept}
            from={SCENE_TIMING.departments.start + index * DEPT_DURATION}
            durationInFrames={DEPT_DURATION}
          >
            <DepartmentScene
              department={dept}
              departmentName={name}
              color={colors.primary}
              bgColor={colors.bg}
            />
          </Sequence>
        );
      })}

      {/* Scene 4: Workflow Animation */}
      <Sequence from={SCENE_TIMING.workflow.start} durationInFrames={SCENE_TIMING.workflow.duration}>
        <WorkflowScene />
      </Sequence>

      {/* Scene 5: Stats */}
      <Sequence from={SCENE_TIMING.stats.start} durationInFrames={SCENE_TIMING.stats.duration}>
        <StatsScene />
      </Sequence>

      {/* Scene 6: CTA */}
      <Sequence from={SCENE_TIMING.cta.start} durationInFrames={SCENE_TIMING.cta.duration}>
        <CTAScene />
      </Sequence>
    </div>
  );
};
