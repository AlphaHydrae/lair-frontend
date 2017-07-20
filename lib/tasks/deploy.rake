require File.join(File.dirname(__FILE__), '..', 'deploy.rb')

# CONFIGURATION

set :envs, ->{ %i(vagrant production) }
set :env, ->{ ENV['LAIR_DEPLOY_ENV'] }

set :local_root, ->{ File.join File.dirname(__FILE__), '..', '..' }
set :local_docker, ->{ File.join fetch(:local_root), 'docker' }

set :root, ->{ ENV['DEPLOY_ROOT'] || '/var/lib/lair/frontend' }
set :repo, ->{ File.join fetch(:root), 'repo' }
set :checkout, ->{ File.join fetch(:root), 'checkout' }
set :build, ->{ ENV['DEPLOY_BUILD'] || fetch(:checkout) }
set :tmp, ->{ File.join fetch(:root), 'tmp' }

set :repo_url, ->{ ENV['DEPLOY_REPO_URL'] || 'https://github.com/AlphaHydrae/lair-frontend.git' }
set :branch, ->{ ENV['DEPLOY_REF'] || 'master' }

set :docker_volume, ->{ ENV['DEPLOY_VOLUME'] }

set :host do
  host = ENV['DEPLOY_SSH_HOST']
  host = "#{ENV['DEPLOY_SSH_USER']}@#{host}" if ENV['DEPLOY_SSH_USER']
  host = "#{host}:#{ENV['DEPLOY_SSH_PORT']}" if ENV['DEPLOY_SSH_PORT']
  host
end

# TASKS

fetch(:envs).each do |env|
  task env do
    ENV['DEPLOY_ENV'] = env.to_s
  end
end

deploy_task deploy: %i(deploy:build) do

  volumes = {}
  volumes[fetch(:docker_volume)] = '/var/www/dist'

  docker_run image: 'alphahydrae/lair-frontend', volumes: volumes
end

namespace :deploy do
  task :env do
    envs = fetch(:envs).collect &:to_s
    deploy_env = ENV['DEPLOY_ENV']
    raise "$DEPLOY_ENV must be set; use `rake <env> <task>` with env being one of #{envs.join(', ')}" unless deploy_env
    raise "Unsupported deployment environment #{deploy_env}; supported environments are #{envs.join(', ')}" unless envs.include? deploy_env

    Dotenv.load! ".env.#{deploy_env}"
    ENV['DEPLOY_ENV'] = deploy_env
  end

  deploy_task build: %i(deploy:repo:checkout) do

    build_args = {
      GOOGLE_CLIENT_ID: ENV['GOOGLE_CLIENT_ID']
    }

    docker_build path: fetch(:checkout), name: 'alphahydrae/lair-frontend', build_args: build_args
  end

  namespace :repo do
    deploy_task update: %i(deploy:env) do
      repo_dir = fetch :repo
      if test "[ ! -d #{repo_dir} ]"
        within fetch(:root) do
          execute :git, 'clone', '--mirror', fetch(:repo_url), 'repo'
        end
      else
        within repo_dir do
          execute :git, 'fetch', '--all'
          execute :git, 'fetch', 'origin', "'+refs/heads/*:refs/heads/*'"
        end
      end
    end

    deploy_task checkout: %i(deploy:repo:update) do

      archive_file = File.join fetch(:tmp), 'checkout.tar'

      execute :rm, '-fr', fetch(:checkout)
      execute :mkdir, '-p', fetch(:checkout), fetch(:tmp)

      within fetch(:repo) do
        execute :git, 'archive', '--output', archive_file, fetch(:branch)
      end

      within fetch(:tmp) do
        execute :tar, '-C', fetch(:checkout), '-x', '--file', archive_file
      end
    end

    deploy_task ensure_checkout: %i(deploy:env) do
      raise "Repository has not been checked out" unless test "[ -d #{fetch(:checkout)} ]"
    end
  end

  deploy_task setup: %i(deploy:env) do
    execute :mkdir, '-p', fetch(:root)
  end

  deploy_task uname: %i(deploy:env) do
    puts capture(:uname, '-a')
  end
end

def docker_build path:, name:, build_args: {}, no_cache: false

  args = []
  args << '-t' << name.to_s
  args << '--no-cache' if no_cache

  build_args.each do |key,value|
    args << '--build-arg' << "#{key}=#{value}"
  end

  args << '.'

  within path.to_s do
    execute :docker, 'build', *args
  end
end

def docker_run image:, rm: true, volumes: {}

  args = []
  args << '--rm' if rm

  volumes.each do |key,value|
    args << '--volume' << "#{key}:#{value}"
  end

  args << image.to_s

  within fetch(:root) do
    capture :docker, 'run', *args
  end
end
