require 'dotenv'
require 'fileutils'
require 'highline'
require 'shellwords'
require 'sshkit'
require 'sshkit/dsl'
require 'tmpdir'

include SSHKit::DSL
SSHKit.config.output_verbosity = :debug if ENV['DEBUG']

LAIR_DEPLOY_DATA = {}

def set key, value = nil, &block
  LAIR_DEPLOY_DATA[key] = value.nil? && block ? block : value
end

def fetch key
  if !LAIR_DEPLOY_DATA.key?(key)
    raise "Unknown deploy data key #{key.inspect}"
  elsif LAIR_DEPLOY_DATA[key].respond_to?(:call)
    LAIR_DEPLOY_DATA[key] = LAIR_DEPLOY_DATA[key].call
  else
    LAIR_DEPLOY_DATA[key]
  end
end

set :local_tmp, ->{ Dir.mktmpdir }

def deploy_task *args, &block
  task *args do |*task_args|
    on fetch(:host) do
      begin
        instance_exec *task_args, &block
      ensure
        tmp_dir = LAIR_DEPLOY_DATA[:local_tmp]
        if !tmp_dir.respond_to?(:call)
          puts "Removing temporary directory #{tmp_dir}" if ENV['DEBUG']
          FileUtils.remove_entry_secure tmp_dir
          set :local_tmp, ->{ Dir.mktmpdir }
        end
      end
    end
  end
end
