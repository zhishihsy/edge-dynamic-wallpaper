/*
这是一个辅助工具，用于扫描 "videos" 文件夹,
并自动生成 "videoConfig.js" 文件。
如何编译 (需要 C++17):
g++ -std=c++17 update_videos.cpp -o update_videos
 */

#include <algorithm>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <set>
#include <string>
#include <vector>

const std::set<std::string> videoExtensions = {".mp4", ".webm", ".ogv"};

int main() {
  std::string videosDir = "videos";           // 视频子目录
  std::string configFile = "videoConfig.js";  // 目标输出文件
  std::vector<std::string> videoFiles;

  std::cout << "正在扫描 " << videosDir << " 文件夹..." << std::endl;

  // 检查 "videos" 目录是否存在
  if (!std::filesystem::is_directory(videosDir)) {
    std::cerr << "错误: " << videosDir << " 文件夹未找到!" << std::endl;
    std::cerr << "请确保此程序与 'videos' 文件夹在同一目录下。" << std::endl;
    return 1;
  }

  // 遍历 "videos" 目录中的所有文件
  for (const auto& entry : std::filesystem::directory_iterator(videosDir)) {
    if (entry.is_regular_file()) {
      std::string ext = entry.path().extension().string();

      std::transform(ext.begin(), ext.end(), ext.begin(), ::tolower);

      if (videoExtensions.count(ext)) {
        videoFiles.push_back(entry.path().filename().string());
      }
    }
  }

  if (videoFiles.empty()) {
    std::cout << "未在 " << videosDir << " 中找到任何视频文件。" << std::endl;
  } else {
    std::cout << "找到了 " << videoFiles.size() << " 个视频文件。" << std::endl;
  }

  // --- 开始写入 videoConfig.js ---
  std::ofstream outFile(configFile);
  if (!outFile) {
    std::cerr << "错误: 无法打开 " << configFile << " 进行写入!" << std::endl;
    return 1;
  }

  // 写入文件头
  outFile << "// videoConfig.js" << std::endl;
  outFile << "// (此文件由 C++ 程序自动生成)" << std::endl;
  outFile << std::endl;
  outFile << "const videoList = [" << std::endl;

  // 写入视频列表
  for (size_t i = 0; i < videoFiles.size(); ++i) {
    outFile << "    \"" << videoFiles[i] << "\"";  // "filename.mp4"

    if (i < videoFiles.size() - 1) {
      outFile << ",";
    }
    outFile << std::endl;
  }

  // 写入文件尾
  outFile << "];" << std::endl;

  outFile.close();

  std::cout << "成功更新 " << configFile << "!" << std::endl;
  std::cout << "请按回车键退出..." << std::endl;
  std::cin.get();  // 等待用户按键

  return 0;
}